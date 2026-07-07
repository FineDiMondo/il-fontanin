"""
API Gestione Canzoniere Comunitario.
"""

from typing import List, Optional
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from community_module.models.community_models import (
    get_session, CommunityUser, CanzoniereBrano, CanzoniereVersione,
    CanzoniereRaccolta, CanzoniereRaccoltaBrano
)
from community_module.models.schemas import (
    CanzoniereBranoCreate, CanzoniereBranoOut,
    CanzoniereRaccoltaCreate, CanzoniereRaccoltaOut,
    MessageResponse, PaginatedResponse
)
from community_module.auth.community_auth import (
    get_current_user, get_current_user_optional, require_socio, require_admin
)

router = APIRouter(prefix="/canzoniere", tags=["canzoniere"])


# =============================================================================
# BRANI
# =============================================================================

@router.get("/brani", response_model=PaginatedResponse, openapi_extra={"security": []})
def list_brani(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: Optional[str] = None
):
    session = get_session()
    try:
        query = session.query(CanzoniereBrano)
        
        if q:
            search = f"%{q}%"
            query = query.filter(
                (CanzoniereBrano.titolo.ilike(search)) |
                (CanzoniereBrano.autore.ilike(search))
            )
            
        total = query.count()
        brani = query.order_by(CanzoniereBrano.titolo).offset((page - 1) * per_page).limit(per_page).all()
        
        items = [CanzoniereBranoOut.model_validate(b).model_dump() for b in brani]
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    finally:
        session.close()

@router.get("/brani/{brano_id}", response_model=CanzoniereBranoOut, openapi_extra={"security": []})
def get_brano(brano_id: UUID):
    session = get_session()
    try:
        brano = session.query(CanzoniereBrano).filter(CanzoniereBrano.id == brano_id).first()
        if not brano:
            raise HTTPException(status_code=404, detail="Brano non trovato")
        return brano
    finally:
        session.close()

@router.post("/brani", response_model=CanzoniereBranoOut)
def create_brano(
    payload: CanzoniereBranoCreate,
    current_user: CommunityUser = Depends(require_socio)
):
    session = get_session()
    try:
        brano = CanzoniereBrano(
            titolo=payload.titolo,
            autore=payload.autore,
            tipo=payload.tipo,
            tonalita_originale=payload.tonalita_originale,
            capotasto=payload.capotasto,
            tempo_bpm=payload.tempo_bpm,
            ritmo_strumming=payload.ritmo_strumming,
            testo_accordi=payload.testo_accordi,
            fonte=payload.fonte,
            fonte_url=payload.fonte_url,
            licenza=payload.licenza,
            creato_da=current_user.id,
            modificato_da=current_user.id,
            versione=1
        )
        session.add(brano)
        session.flush()

        versione = CanzoniereVersione(
            brano_id=brano.id,
            versione=1,
            contenuto_testo=brano.testo_accordi,
            modificato_da=current_user.id
        )
        session.add(versione)
        session.commit()
        session.refresh(brano)
        return brano
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        session.close()

@router.put("/brani/{brano_id}", response_model=CanzoniereBranoOut)
def update_brano(
    brano_id: UUID,
    payload: CanzoniereBranoCreate,
    current_user: CommunityUser = Depends(require_socio)
):
    session = get_session()
    try:
        brano = session.query(CanzoniereBrano).filter(CanzoniereBrano.id == brano_id).first()
        if not brano:
            raise HTTPException(status_code=404, detail="Brano non trovato")
            
        brano.titolo = payload.titolo
        brano.autore = payload.autore
        brano.tipo = payload.tipo
        brano.tonalita_originale = payload.tonalita_originale
        brano.capotasto = payload.capotasto
        brano.tempo_bpm = payload.tempo_bpm
        brano.ritmo_strumming = payload.ritmo_strumming
        brano.testo_accordi = payload.testo_accordi
        brano.fonte = payload.fonte
        brano.fonte_url = payload.fonte_url
        brano.licenza = payload.licenza
        
        brano.modificato_da = current_user.id
        brano.versione += 1
        
        versione = CanzoniereVersione(
            brano_id=brano.id,
            versione=brano.versione,
            contenuto_testo=brano.testo_accordi,
            modificato_da=current_user.id
        )
        session.add(versione)
        session.commit()
        session.refresh(brano)
        return brano
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        session.close()

# =============================================================================
# RACCOLTE
# =============================================================================

@router.get("/raccolte", response_model=List[CanzoniereRaccoltaOut], openapi_extra={"security": []})
def list_raccolte(current_user: Optional[CommunityUser] = Depends(get_current_user_optional)):
    session = get_session()
    try:
        q = session.query(CanzoniereRaccolta)
        if not current_user or current_user.ruolo == "guest":
            q = q.filter(CanzoniereRaccolta.pubblica == True)
        else:
            q = q.filter(
                (CanzoniereRaccolta.pubblica == True) | 
                (CanzoniereRaccolta.creato_da == current_user.id)
            )
        return q.order_by(CanzoniereRaccolta.nome).all()
    finally:
        session.close()

@router.post("/raccolte", response_model=CanzoniereRaccoltaOut)
def create_raccolta(
    payload: CanzoniereRaccoltaCreate,
    current_user: CommunityUser = Depends(require_socio)
):
    session = get_session()
    try:
        raccolta = CanzoniereRaccolta(
            nome=payload.nome,
            descrizione=payload.descrizione,
            pubblica=payload.pubblica,
            creato_da=current_user.id
        )
        session.add(raccolta)
        session.commit()
        session.refresh(raccolta)
        return raccolta
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        session.close()
