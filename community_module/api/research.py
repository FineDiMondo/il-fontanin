"""
API Ricerca / Esperimenti Sociali.
Admin: crea e gestisce esperimenti.
Soci: partecipano a sondaggi, inviano risposte.
"""

import csv
import hashlib
import io
import json
from uuid import UUID, uuid4
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import StreamingResponse

from community_module.models.community_models import (
    get_session, CommunityUser,
    ResearchExperiment, ResearchSurvey, ResearchResponse, ResearchObservation
)
from community_module.models.schemas import (
    ExperimentCreate, ExperimentOut,
    SurveyCreate, SurveyOut,
    SurveyResponseSubmit, MessageResponse
)
from community_module.auth.community_auth import (
    get_current_user, get_current_user_optional, require_socio, require_admin
)

router = APIRouter(prefix="/research", tags=["research"])


# =============================================================================
# ESPERIMENTI (gestione admin)
# =============================================================================

@router.post("/experiments", response_model=ExperimentOut)
def create_experiment(
    data: ExperimentCreate,
    current_user: CommunityUser = Depends(require_admin),
):
    session = get_session()
    try:
        exp = ResearchExperiment(
            titolo=data.titolo,
            descrizione=data.descrizione,
            tipo=data.tipo,
            anonimo=data.anonimo,
            starts_at=data.starts_at,
            ends_at=data.ends_at,
            creato_da=current_user.id,
        )
        session.add(exp)
        session.commit()
        session.refresh(exp)
        return exp
    finally:
        session.close()


@router.get("/experiments", response_model=List[ExperimentOut], openapi_extra={"security": []})
def list_experiments(
    stato: Optional[str] = Query(None),
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    session = get_session()
    try:
        q = session.query(ResearchExperiment)
        if not current_user or current_user.ruolo not in ("socio", "admin"):
            q = q.filter(ResearchExperiment.stato == "attivo")
        elif stato:
            q = q.filter(ResearchExperiment.stato == stato)
        return q.order_by(ResearchExperiment.created_at.desc()).all()
    finally:
        session.close()


@router.get("/experiments/{experiment_id}", response_model=ExperimentOut)
def get_experiment(
    experiment_id: UUID,
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    session = get_session()
    try:
        exp = session.query(ResearchExperiment).filter(ResearchExperiment.id == experiment_id).first()
        if not exp:
            raise HTTPException(status_code=404, detail="Esperimento non trovato")
        if exp.stato != "attivo" and (not current_user or current_user.ruolo != "admin"):
            raise HTTPException(status_code=403, detail="Esperimento non disponibile")
        return exp
    finally:
        session.close()


@router.patch("/experiments/{experiment_id}/stato", response_model=ExperimentOut)
def change_experiment_stato(
    experiment_id: UUID,
    stato: str = Query(pattern="^(bozza|attivo|chiuso|archiviato)$"),
    current_user: CommunityUser = Depends(require_admin),
):
    session = get_session()
    try:
        exp = session.query(ResearchExperiment).filter(ResearchExperiment.id == experiment_id).first()
        if not exp:
            raise HTTPException(status_code=404, detail="Esperimento non trovato")
        exp.stato = stato
        session.commit()
        session.refresh(exp)
        return exp
    finally:
        session.close()


# =============================================================================
# SONDAGGI
# =============================================================================

@router.post("/experiments/{experiment_id}/surveys", response_model=SurveyOut)
def create_survey(
    experiment_id: UUID,
    data: SurveyCreate,
    current_user: CommunityUser = Depends(require_admin),
):
    session = get_session()
    try:
        exp = session.query(ResearchExperiment).filter(ResearchExperiment.id == experiment_id).first()
        if not exp:
            raise HTTPException(status_code=404, detail="Esperimento non trovato")

        survey = ResearchSurvey(
            experiment_id=experiment_id,
            titolo=data.titolo,
            domande_json=[d.model_dump() for d in data.domande],
        )
        session.add(survey)
        session.commit()
        session.refresh(survey)
        return survey
    finally:
        session.close()


@router.get("/experiments/{experiment_id}/surveys", response_model=List[SurveyOut])
def list_surveys(
    experiment_id: UUID,
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    session = get_session()
    try:
        exp = session.query(ResearchExperiment).filter(ResearchExperiment.id == experiment_id).first()
        if not exp:
            raise HTTPException(status_code=404, detail="Esperimento non trovato")
        if exp.stato != "attivo" and (not current_user or current_user.ruolo != "admin"):
            raise HTTPException(status_code=403, detail="Esperimento non disponibile")

        return session.query(ResearchSurvey).filter(ResearchSurvey.experiment_id == experiment_id).all()
    finally:
        session.close()


# =============================================================================
# RISPOSTE
# =============================================================================

@router.post("/surveys/{survey_id}/responses", response_model=MessageResponse)
def submit_response(
    survey_id: UUID,
    data: SurveyResponseSubmit,
    request: Request,
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    session = get_session()
    try:
        survey = session.query(ResearchSurvey).filter(ResearchSurvey.id == survey_id).first()
        if not survey:
            raise HTTPException(status_code=404, detail="Sondaggio non trovato")

        exp = session.query(ResearchExperiment).filter(ResearchExperiment.id == survey.experiment_id).first()
        if exp.stato != "attivo":
            raise HTTPException(status_code=400, detail="Il sondaggio non è attualmente attivo")

        # Verifica duplicati per utente autenticato
        if current_user:
            existing = session.query(ResearchResponse).filter(
                ResearchResponse.survey_id == survey_id,
                ResearchResponse.user_id == current_user.id,
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail="Hai già risposto a questo sondaggio")

        request_ip = request.client.host if request.client else None
        ip_hash = None
        if request_ip:
            ip_hash = hashlib.sha256(request_ip.encode()).hexdigest()

        response = ResearchResponse(
            survey_id=survey_id,
            user_id=current_user.id if current_user and not exp.anonimo else None,
            token_anonimo=data.token_anonimo or str(uuid4()) if exp.anonimo else None,
            risposte_json=data.risposte,
            ip_hash=ip_hash,
        )
        session.add(response)
        session.commit()
        return MessageResponse(message="Risposta registrata con successo")
    finally:
        session.close()


# =============================================================================
# EXPORT DATI (solo admin)
# =============================================================================

@router.get("/surveys/{survey_id}/export")
def export_responses(
    survey_id: UUID,
    formato: str = Query("csv", pattern="^(csv|json)$"),
    current_user: CommunityUser = Depends(require_admin),
):
    """Esporta le risposte di un sondaggio in CSV o JSON per analisi esterna."""
    session = get_session()
    try:
        survey = session.query(ResearchSurvey).filter(ResearchSurvey.id == survey_id).first()
        if not survey:
            raise HTTPException(status_code=404, detail="Sondaggio non trovato")

        responses = session.query(ResearchResponse).filter(
            ResearchResponse.survey_id == survey_id
        ).order_by(ResearchResponse.submitted_at).all()

        domande = survey.domande_json

        if formato == "json":
            data = []
            for r in responses:
                data.append({
                    "id": str(r.id),
                    "user_id": str(r.user_id) if r.user_id else None,
                    "submitted_at": r.submitted_at.isoformat(),
                    "risposte": r.risposte_json,
                })
            return data

        # CSV
        output = io.StringIO()
        fieldnames = ["id", "submitted_at", "user_id"] + [d["id"] for d in domande]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for r in responses:
            row = {
                "id": str(r.id),
                "submitted_at": r.submitted_at.isoformat(),
                "user_id": str(r.user_id) if r.user_id else "anonimo",
            }
            for d in domande:
                row[d["id"]] = r.risposte_json.get(d["id"], "")
            writer.writerow(row)

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=survey_{survey_id}.csv"},
        )
    finally:
        session.close()


@router.get("/experiments/{experiment_id}/stats")
def experiment_stats(
    experiment_id: UUID,
    current_user: CommunityUser = Depends(require_admin),
):
    """Statistiche aggregate sull'esperimento."""
    session = get_session()
    try:
        exp = session.query(ResearchExperiment).filter(ResearchExperiment.id == experiment_id).first()
        if not exp:
            raise HTTPException(status_code=404, detail="Esperimento non trovato")

        surveys = session.query(ResearchSurvey).filter(ResearchSurvey.experiment_id == experiment_id).all()
        total_responses = 0
        survey_stats = []

        for s in surveys:
            count = session.query(ResearchResponse).filter(ResearchResponse.survey_id == s.id).count()
            total_responses += count
            survey_stats.append({
                "survey_id": str(s.id),
                "titolo": s.titolo,
                "risposte": count,
            })

        observations_count = session.query(ResearchObservation).filter(
            ResearchObservation.experiment_id == experiment_id
        ).count()

        return {
            "experiment_id": str(experiment_id),
            "titolo": exp.titolo,
            "stato": exp.stato,
            "totale_risposte": total_responses,
            "totale_osservazioni": observations_count,
            "surveys": survey_stats,
        }
    finally:
        session.close()
