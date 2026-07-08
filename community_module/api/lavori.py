"""
API Lavori: gestione progetti di scalette, argini, piscinetta al Fontanin.
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query

from community_module.models.community_models import (
    get_session, CommunityUser, LavoriProgetto
)
from community_module.models.schemas import (
    LavoriCreate, LavoriUpdate, LavoriOut
)
from community_module.auth.community_auth import (
    get_current_user_optional, require_socio
)

router = APIRouter(prefix="/lavori", tags=["lavori"])


@router.get("/progetti", response_model=List[LavoriOut], openapi_extra={"security": []})
def list_lavori(
    tipo: Optional[str] = Query(None),
    stato: Optional[str] = Query(None),
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    """Lista progetti (filtrabili per tipo e stato)."""
    session = get_session()
    try:
        q = session.query(LavoriProgetto).order_by(LavoriProgetto.created_at.desc())
        if tipo:
            q = q.filter(LavoriProgetto.tipo == tipo)
        if stato:
            q = q.filter(LavoriProgetto.stato == stato)
        return q.all()
    finally:
        session.close()


@router.post("/progetti", response_model=LavoriOut)
def create_lavoro(
    data: LavoriCreate,
    current_user: CommunityUser = Depends(require_socio),
):
    """Crea un nuovo progetto (solo soci)."""
    session = get_session()
    try:
        lavoro = LavoriProgetto(
            titolo=data.titolo,
            descrizione=data.descrizione,
            tipo=data.tipo,
            lat=data.lat,
            lng=data.lng,
            attrezzi=data.attrezzi,
            video_url=data.video_url,
            immagini=data.immagini,
            note=data.note,
            created_by=current_user.id,
        )
        session.add(lavoro)
        session.commit()
        session.refresh(lavoro)
        return lavoro
    finally:
        session.close()


@router.get("/progetti/{lavoro_id}", response_model=LavoriOut)
def get_lavoro(
    lavoro_id: UUID,
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    """Dettagli progetto."""
    session = get_session()
    try:
        lavoro = session.query(LavoriProgetto).filter(
            LavoriProgetto.id == lavoro_id
        ).first()
        if not lavoro:
            raise HTTPException(status_code=404, detail="Progetto non trovato")
        return lavoro
    finally:
        session.close()


@router.patch("/progetti/{lavoro_id}", response_model=LavoriOut)
def update_lavoro(
    lavoro_id: UUID,
    data: LavoriUpdate,
    current_user: CommunityUser = Depends(require_socio),
):
    """Aggiorna progetto (solo soci)."""
    session = get_session()
    try:
        lavoro = session.query(LavoriProgetto).filter(
            LavoriProgetto.id == lavoro_id
        ).first()
        if not lavoro:
            raise HTTPException(status_code=404, detail="Progetto non trovato")

        # Aggiorna i campi forniti
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(lavoro, key, value)

        session.commit()
        session.refresh(lavoro)
        return lavoro
    finally:
        session.close()


@router.delete("/progetti/{lavoro_id}")
def delete_lavoro(
    lavoro_id: UUID,
    current_user: CommunityUser = Depends(require_socio),
):
    """Elimina progetto (solo soci)."""
    session = get_session()
    try:
        lavoro = session.query(LavoriProgetto).filter(
            LavoriProgetto.id == lavoro_id
        ).first()
        if not lavoro:
            raise HTTPException(status_code=404, detail="Progetto non trovato")
        session.delete(lavoro)
        session.commit()
        return {"ok": True}
    finally:
        session.close()
