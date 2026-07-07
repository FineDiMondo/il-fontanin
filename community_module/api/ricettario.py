"""
API Gestione Ricettario Comunitario.
"""

from typing import List, Optional
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from community_module.models.community_models import (
    get_session, CommunityUser, RicettarioRicetta, RicettarioIngrediente,
    RicettarioVersione, RicettarioRaccolta, RicettarioRaccoltaRicetta
)
from community_module.models.schemas import (
    RicettarioRicettaCreate, RicettarioRicettaOut,
    RicettarioRaccoltaCreate, RicettarioRaccoltaOut,
    MessageResponse, PaginatedResponse
)
from community_module.auth.community_auth import (
    get_current_user, get_current_user_optional, require_socio, require_admin
)

router = APIRouter(prefix="/ricettario", tags=["ricettario"])


# =============================================================================
# RICETTE
# =============================================================================

@router.get("/ricette", response_model=PaginatedResponse, openapi_extra={"security": []})
def list_ricette(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: Optional[str] = None
):
    session = get_session()
    try:
        query = session.query(RicettarioRicetta)
        
        if q:
            search = f"%{q}%"
            query = query.filter(
                (RicettarioRicetta.nome.ilike(search)) |
                (RicettarioRicetta.categoria.ilike(search))
            )
            
        total = query.count()
        ricette = query.order_by(RicettarioRicetta.nome).offset((page - 1) * per_page).limit(per_page).all()
        
        items = [RicettarioRicettaOut.model_validate(r).model_dump() for r in ricette]
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    finally:
        session.close()

@router.get("/ricette/{ricetta_id}", response_model=RicettarioRicettaOut, openapi_extra={"security": []})
def get_ricetta(ricetta_id: UUID):
    session = get_session()
    try:
        ricetta = session.query(RicettarioRicetta).filter(RicettarioRicetta.id == ricetta_id).first()
        if not ricetta:
            raise HTTPException(status_code=404, detail="Ricetta non trovata")
            
        # Carica ingredienti
        ingredienti = session.query(RicettarioIngrediente).filter(
            RicettarioIngrediente.ricetta_id == ricetta_id
        ).order_by(RicettarioIngrediente.ordine).all()
        
        result = RicettarioRicettaOut.model_validate(ricetta).model_dump()
        result["ingredienti"] = [{
            "nome": i.nome,
            "quantita": float(i.quantita) if i.quantita else None,
            "unita": i.unita,
            "opzionale": i.opzionale,
            "note": i.note
        } for i in ingredienti]
        
        return result
    finally:
        session.close()

@router.post("/ricette", response_model=RicettarioRicettaOut)
def create_ricetta(
    payload: RicettarioRicettaCreate,
    current_user: CommunityUser = Depends(require_socio)
):
    session = get_session()
    try:
        ricetta = RicettarioRicetta(
            nome=payload.nome,
            categoria=payload.categoria,
            tipo_cucina=payload.tipo_cucina,
            porzioni_base=payload.porzioni_base,
            tempo_prep_min=payload.tempo_prep_min,
            tempo_cottura_min=payload.tempo_cottura_min,
            difficolta=payload.difficolta,
            procedimento=payload.procedimento,
            tag_dietetici=payload.tag_dietetici,
            fonte=payload.fonte,
            fonte_url=payload.fonte_url,
            licenza=payload.licenza,
            foto_drive_id=payload.foto_drive_id,
            creato_da=current_user.id,
            modificato_da=current_user.id,
            versione=1
        )
        session.add(ricetta)
        session.flush()

        for idx, ingr in enumerate(payload.ingredienti):
            ingrediente = RicettarioIngrediente(
                ricetta_id=ricetta.id,
                nome=ingr.nome,
                quantita=ingr.quantita,
                unita=ingr.unita,
                opzionale=ingr.opzionale,
                note=ingr.note,
                ordine=idx
            )
            session.add(ingrediente)
            
        # Snapshot in JSON per le versioni
        contenuto_json = payload.model_dump()
        versione = RicettarioVersione(
            ricetta_id=ricetta.id,
            versione=1,
            contenuto_json=contenuto_json,
            modificato_da=current_user.id
        )
        session.add(versione)
        
        session.commit()
        session.refresh(ricetta)
        
        # Ritorniamo i dati completi
        result = RicettarioRicettaOut.model_validate(ricetta).model_dump()
        result["ingredienti"] = [i.model_dump() for i in payload.ingredienti]
        return result
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        session.close()

@router.put("/ricette/{ricetta_id}", response_model=RicettarioRicettaOut)
def update_ricetta(
    ricetta_id: UUID,
    payload: RicettarioRicettaCreate,
    current_user: CommunityUser = Depends(require_socio)
):
    session = get_session()
    try:
        ricetta = session.query(RicettarioRicetta).filter(RicettarioRicetta.id == ricetta_id).first()
        if not ricetta:
            raise HTTPException(status_code=404, detail="Ricetta non trovata")
            
        ricetta.nome = payload.nome
        ricetta.categoria = payload.categoria
        ricetta.tipo_cucina = payload.tipo_cucina
        ricetta.porzioni_base = payload.porzioni_base
        ricetta.tempo_prep_min = payload.tempo_prep_min
        ricetta.tempo_cottura_min = payload.tempo_cottura_min
        ricetta.difficolta = payload.difficolta
        ricetta.procedimento = payload.procedimento
        ricetta.tag_dietetici = payload.tag_dietetici
        ricetta.fonte = payload.fonte
        ricetta.fonte_url = payload.fonte_url
        ricetta.licenza = payload.licenza
        ricetta.foto_drive_id = payload.foto_drive_id
        
        ricetta.modificato_da = current_user.id
        ricetta.versione += 1
        
        # Elimina vecchi ingredienti e ricrea
        session.query(RicettarioIngrediente).filter(RicettarioIngrediente.ricetta_id == ricetta_id).delete()
        
        for idx, ingr in enumerate(payload.ingredienti):
            ingrediente = RicettarioIngrediente(
                ricetta_id=ricetta.id,
                nome=ingr.nome,
                quantita=ingr.quantita,
                unita=ingr.unita,
                opzionale=ingr.opzionale,
                note=ingr.note,
                ordine=idx
            )
            session.add(ingrediente)
            
        versione = RicettarioVersione(
            ricetta_id=ricetta.id,
            versione=ricetta.versione,
            contenuto_json=payload.model_dump(),
            modificato_da=current_user.id
        )
        session.add(versione)
        
        session.commit()
        session.refresh(ricetta)
        
        result = RicettarioRicettaOut.model_validate(ricetta).model_dump()
        result["ingredienti"] = [i.model_dump() for i in payload.ingredienti]
        return result
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

@router.get("/raccolte", response_model=List[RicettarioRaccoltaOut], openapi_extra={"security": []})
def list_raccolte(current_user: Optional[CommunityUser] = Depends(get_current_user_optional)):
    session = get_session()
    try:
        q = session.query(RicettarioRaccolta)
        if not current_user or current_user.ruolo == "guest":
            q = q.filter(RicettarioRaccolta.pubblica == True)
        else:
            q = q.filter(
                (RicettarioRaccolta.pubblica == True) | 
                (RicettarioRaccolta.creato_da == current_user.id)
            )
        return q.order_by(RicettarioRaccolta.nome).all()
    finally:
        session.close()

@router.post("/raccolte", response_model=RicettarioRaccoltaOut)
def create_raccolta(
    payload: RicettarioRaccoltaCreate,
    current_user: CommunityUser = Depends(require_socio)
):
    session = get_session()
    try:
        raccolta = RicettarioRaccolta(
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
