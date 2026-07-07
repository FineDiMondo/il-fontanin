from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from community_module.models.community_models import (
    get_session, CommunityUser, CompetenzaDominio, CompetenzaUtente
)
from community_module.models.schemas import (
    DominioCreate, DominioOut, CompetenzaDichiarazione, CompetenzaValida, CompetenzaOut
)
from community_module.auth.community_auth import get_current_user, require_admin
from community_module.services.competenze_service import is_validatore_per_dominio

router = APIRouter(prefix="/competenze", tags=["Competenze e Validatori"])

def require_socio(current_user: CommunityUser = Depends(get_current_user)) -> CommunityUser:
    if current_user.ruolo not in ["socio", "admin"]:
        raise HTTPException(status_code=403, detail="Richiesta qualifica Socio")
    return current_user

def get_db_session():
    session = get_session()
    try:
        yield session
    finally:
        session.close()

@router.get("/domini", response_model=List[DominioOut])
def get_domini(session: Session = Depends(get_db_session)):
    domini = session.query(CompetenzaDominio).filter(CompetenzaDominio.attivo == True).all()
    return domini

@router.post("/domini", response_model=DominioOut)
def create_dominio(
    dominio_in: DominioCreate,
    session: Session = Depends(get_db_session),
    current_user: CommunityUser = Depends(require_admin)
):
    dominio_esistente = session.query(CompetenzaDominio).filter(CompetenzaDominio.codice == dominio_in.codice).first()
    if dominio_esistente:
        raise HTTPException(status_code=400, detail="Dominio con questo codice già esistente")
        
    nuovo_dominio = CompetenzaDominio(
        codice=dominio_in.codice,
        nome=dominio_in.nome,
        descrizione=dominio_in.descrizione,
        domande_json=[d.model_dump() for d in dominio_in.domande],
        created_by=current_user.id
    )
    
    session.add(nuovo_dominio)
    session.commit()
    session.refresh(nuovo_dominio)
    return nuovo_dominio

@router.get("/me", response_model=List[CompetenzaOut])
def get_mie_competenze(
    session: Session = Depends(get_db_session),
    current_user: CommunityUser = Depends(get_current_user)
):
    competenze = session.query(CompetenzaUtente).filter(CompetenzaUtente.user_id == current_user.id).all()
    return competenze

@router.put("/me/{dominio_id}", response_model=CompetenzaOut)
def upsert_mia_competenza(
    dominio_id: UUID,
    payload: CompetenzaDichiarazione,
    session: Session = Depends(get_db_session),
    current_user: CommunityUser = Depends(require_socio)
):
    dominio = session.query(CompetenzaDominio).filter(CompetenzaDominio.id == dominio_id).first()
    if not dominio or not dominio.attivo:
        raise HTTPException(status_code=404, detail="Dominio non trovato o non attivo")
        
    competenza = session.query(CompetenzaUtente).filter(
        CompetenzaUtente.user_id == current_user.id,
        CompetenzaUtente.dominio_id == dominio_id
    ).first()
    
    if competenza:
        competenza.livello_dichiarato = payload.livello_dichiarato
        competenza.fonte = payload.fonte
        if payload.risposte_json is not None:
            competenza.risposte_json = payload.risposte_json
        competenza.data_ultima_revisione = datetime.now(timezone.utc)
        # Resetta la validazione quando l'utente modifica la dichiarazione
        competenza.livello_validato = None
        competenza.validato_da = None
        competenza.validato_at = None
    else:
        competenza = CompetenzaUtente(
            user_id=current_user.id,
            dominio_id=dominio_id,
            livello_dichiarato=payload.livello_dichiarato,
            fonte=payload.fonte,
            risposte_json=payload.risposte_json
        )
        session.add(competenza)
        
    session.commit()
    session.refresh(competenza)
    return competenza

@router.patch("/{competenza_id}/valida", response_model=CompetenzaOut)
def valida_competenza(
    competenza_id: UUID,
    payload: CompetenzaValida,
    session: Session = Depends(get_db_session),
    current_user: CommunityUser = Depends(require_admin)
):
    competenza = session.query(CompetenzaUtente).filter(CompetenzaUtente.id == competenza_id).first()
    if not competenza:
        raise HTTPException(status_code=404, detail="Dichiarazione competenza non trovata")
        
    competenza.livello_validato = payload.livello_validato
    competenza.validato_da = current_user.id
    competenza.validato_at = datetime.now(timezone.utc)
    # Eventuale nota potrebbe essere salvata in una colonna note o nel DB se fosse necessario.
    # L'AT non ha specificato una colonna nota su competenza_utente.
    
    session.commit()
    session.refresh(competenza)
    return competenza

@router.get("/me/validatore/{dominio_codice}")
def check_validatore(
    dominio_codice: str,
    session: Session = Depends(get_db_session),
    current_user: CommunityUser = Depends(get_current_user)
):
    is_validatore = is_validatore_per_dominio(session, current_user, dominio_codice)
    return {"is_validatore": is_validatore}
