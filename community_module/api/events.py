"""
API Gestione Eventi.
Pubblici: visibili a tutti, iscrizione solo soci.
Privati: visibili e iscrivibili solo dai soci.
QR check-in per presenze.
"""

import csv
import io
import os
import secrets
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timezone

import qrcode
import qrcode.image.svg

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse, Response

from community_module.models.community_models import (
    get_session, CommunityUser, CommunityEvent,
    EventRegistration, EventCheckin, CommunityNotification
)
from community_module.models.schemas import (
    EventCreate, EventOut, RegistrationOut, CheckinOut, MessageResponse
)
from community_module.auth.community_auth import (
    get_current_user, get_current_user_optional, require_socio, require_admin
)

router = APIRouter(prefix="/events", tags=["events"])

BASE_URL = os.getenv("COMMUNITY_BASE_URL", "https://freedomrun-491323.ey.r.appspot.com")


# =============================================================================
# EVENTI
# =============================================================================

@router.get("", response_model=List[EventOut], openapi_extra={"security": []})
def list_events(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    upcoming: bool = Query(True),
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    session = get_session()
    try:
        q = session.query(CommunityEvent).filter(CommunityEvent.stato == "pubblicato")

        if not current_user or current_user.ruolo == "guest":
            q = q.filter(CommunityEvent.pubblico == True)

        if upcoming:
            q = q.filter(CommunityEvent.starts_at >= datetime.now(timezone.utc))

        events = (
            q.order_by(CommunityEvent.starts_at)
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )

        result = []
        for ev in events:
            iscritti = session.query(EventRegistration).filter(
                EventRegistration.event_id == ev.id,
                EventRegistration.stato == "confermata",
            ).count()
            ev_dict = {
                "id": ev.id, "titolo": ev.titolo, "descrizione": ev.descrizione,
                "luogo": ev.luogo, "luogo_online": ev.luogo_online,
                "starts_at": ev.starts_at, "ends_at": ev.ends_at,
                "max_partecipanti": ev.max_partecipanti, "pubblico": ev.pubblico,
                "stato": ev.stato, "created_at": ev.created_at,
                "iscritti": iscritti,
                "posti_disponibili": (ev.max_partecipanti - iscritti) if ev.max_partecipanti else None,
                "schede_ids": [s.scheda_id for s in ev.schede_catalogo] if hasattr(ev, 'schede_catalogo') else []
            }
            result.append(EventOut(**ev_dict))
        return result
    finally:
        session.close()


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: UUID,
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    session = get_session()
    try:
        ev = session.query(CommunityEvent).filter(CommunityEvent.id == event_id).first()
        if not ev:
            raise HTTPException(status_code=404, detail="Evento non trovato")
        if not ev.pubblico and (not current_user or current_user.ruolo == "guest"):
            raise HTTPException(status_code=403, detail="Evento riservato ai soci")

        iscritti = session.query(EventRegistration).filter(
            EventRegistration.event_id == ev.id,
            EventRegistration.stato == "confermata",
        ).count()

        return EventOut(
            id=ev.id, titolo=ev.titolo, descrizione=ev.descrizione,
            luogo=ev.luogo, luogo_online=ev.luogo_online,
            starts_at=ev.starts_at, ends_at=ev.ends_at,
            max_partecipanti=ev.max_partecipanti, pubblico=ev.pubblico,
            stato=ev.stato, created_at=ev.created_at,
            iscritti=iscritti,
            posti_disponibili=(ev.max_partecipanti - iscritti) if ev.max_partecipanti else None,
            schede_ids=[s.scheda_id for s in ev.schede_catalogo] if hasattr(ev, 'schede_catalogo') else []
        )
    finally:
        session.close()


@router.post("", response_model=EventOut)
def create_event(
    data: EventCreate,
    current_user: CommunityUser = Depends(require_socio),
):
    from community_module.models.community_models import CommunityEventCatalogoScheda, CatalogoScheda
    if not data.schede_ids:
        raise HTTPException(status_code=400, detail="E' richiesta almeno una scheda di catalogo collegata")

    session = get_session()
    try:
        # P1.4: Verificare che le schede esistano e siano pubblicate
        schede_db = session.query(CatalogoScheda).filter(
            CatalogoScheda.id.in_(data.schede_ids),
            CatalogoScheda.stato == 'pubblicato'
        ).all()
        if len(schede_db) != len(data.schede_ids):
            raise HTTPException(status_code=400, detail="Una o più schede non esistono o non sono pubblicate")

        ev = CommunityEvent(
            titolo=data.titolo,
            descrizione=data.descrizione,
            luogo=data.luogo,
            luogo_online=data.luogo_online,
            starts_at=data.starts_at,
            ends_at=data.ends_at,
            max_partecipanti=data.max_partecipanti,
            pubblico=data.pubblico,
            stato="bozza", # P1.4: Anche gli admin creano in bozza, poi validano
            creato_da=current_user.id,
            qr_secret=secrets.token_hex(32),
        )
        session.add(ev)
        session.flush() # Per avere ev.id

        for s_id in data.schede_ids:
            rel = CommunityEventCatalogoScheda(event_id=ev.id, scheda_id=s_id)
            session.add(rel)

        session.commit()
        session.refresh(ev)

        return EventOut(
            id=ev.id, titolo=ev.titolo, descrizione=ev.descrizione,
            luogo=ev.luogo, luogo_online=ev.luogo_online,
            starts_at=ev.starts_at, ends_at=ev.ends_at,
            max_partecipanti=ev.max_partecipanti, pubblico=ev.pubblico,
            stato=ev.stato, created_at=ev.created_at, iscritti=0,
            schede_ids=data.schede_ids
        )
    finally:
        session.close()

@router.post("/{event_id}/valida", response_model=EventOut)
def valida_event(
    event_id: UUID,
    current_user: CommunityUser = Depends(require_admin),
):
    from community_module.models.community_models import CommunityEventCatalogoScheda
    session = get_session()
    try:
        ev = session.query(CommunityEvent).filter(CommunityEvent.id == event_id).first()
        if not ev:
            raise HTTPException(status_code=404, detail="Evento non trovato")
        
        # Validazione >=1 scheda
        schede_count = session.query(CommunityEventCatalogoScheda).filter(CommunityEventCatalogoScheda.event_id == ev.id).count()
        if schede_count < 1:
            raise HTTPException(status_code=400, detail="Impossibile pubblicare: nessuna scheda di catalogo collegata")

        ev.stato = "pubblicato"
        ev.validato_da = current_user.id
        ev.validato_at = datetime.now(timezone.utc)
        
        session.commit()
        session.refresh(ev)

        schede_ids = [rel.scheda_id for rel in session.query(CommunityEventCatalogoScheda).filter(CommunityEventCatalogoScheda.event_id == ev.id).all()]

        return EventOut(
            id=ev.id, titolo=ev.titolo, descrizione=ev.descrizione,
            luogo=ev.luogo, luogo_online=ev.luogo_online,
            starts_at=ev.starts_at, ends_at=ev.ends_at,
            max_partecipanti=ev.max_partecipanti, pubblico=ev.pubblico,
            stato=ev.stato, created_at=ev.created_at, iscritti=0,
            schede_ids=schede_ids
        )
    finally:
        session.close()


@router.delete("/{event_id}", response_model=MessageResponse)
def cancel_event(
    event_id: UUID,
    current_user: CommunityUser = Depends(require_admin),
):
    session = get_session()
    try:
        ev = session.query(CommunityEvent).filter(CommunityEvent.id == event_id).first()
        if not ev:
            raise HTTPException(status_code=404, detail="Evento non trovato")
        ev.stato = "annullato"
        session.commit()
        return MessageResponse(message="Evento annullato")
    finally:
        session.close()


# =============================================================================
# ISCRIZIONI
# =============================================================================

@router.post("/{event_id}/register", response_model=MessageResponse)
def register_to_event(
    event_id: UUID,
    note: Optional[str] = None,
    current_user: CommunityUser = Depends(require_socio),
):
    session = get_session()
    try:
        ev = session.query(CommunityEvent).filter(CommunityEvent.id == event_id).first()
        if not ev:
            raise HTTPException(status_code=404, detail="Evento non trovato")
        if ev.stato != "pubblicato":
            raise HTTPException(status_code=400, detail="Iscrizioni non disponibili")

        existing = session.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == current_user.id,
        ).first()
        if existing and existing.stato != "cancellata":
            raise HTTPException(status_code=409, detail="Sei già iscritto a questo evento")

        # Conta posti disponibili
        confirmed = session.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.stato == "confermata",
        ).count()

        if ev.max_partecipanti and confirmed >= ev.max_partecipanti:
            stato_iscrizione = "in_attesa"
            msg = "Iscritto in lista d'attesa"
        else:
            stato_iscrizione = "confermata"
            msg = "Iscrizione confermata"

        if existing:
            existing.stato = stato_iscrizione
            existing.note = note
        else:
            reg = EventRegistration(
                event_id=event_id,
                user_id=current_user.id,
                stato=stato_iscrizione,
                note=note,
            )
            session.add(reg)

        session.commit()

        # Notifica interna
        notif = CommunityNotification(
            user_id=current_user.id,
            tipo="evento_iscrizione",
            titolo=f"Iscrizione a: {ev.titolo}",
            corpo=f"Stato: {stato_iscrizione}. Data: {ev.starts_at.strftime('%d/%m/%Y %H:%M')}",
            link=f"/events/{event_id}",
        )
        session.add(notif)
        session.commit()

        return MessageResponse(message=msg)
    finally:
        session.close()


@router.delete("/{event_id}/register", response_model=MessageResponse)
def cancel_registration(
    event_id: UUID,
    current_user: CommunityUser = Depends(require_socio),
):
    session = get_session()
    try:
        reg = session.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == current_user.id,
        ).first()
        if not reg:
            raise HTTPException(status_code=404, detail="Iscrizione non trovata")

        reg.stato = "cancellata"
        session.commit()

        # Promuovi il primo in lista d'attesa
        next_waiting = session.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.stato == "in_attesa",
        ).order_by(EventRegistration.registered_at).first()

        if next_waiting:
            next_waiting.stato = "confermata"
            notif = CommunityNotification(
                user_id=next_waiting.user_id,
                tipo="evento_confermato",
                titolo="Posto confermato!",
                corpo=f"Sei stato promosso dalla lista d'attesa per l'evento.",
                link=f"/events/{event_id}",
            )
            session.add(notif)
            session.commit()

        return MessageResponse(message="Iscrizione cancellata")
    finally:
        session.close()


@router.get("/{event_id}/registrations", response_model=List[RegistrationOut])
def list_registrations(
    event_id: UUID,
    current_user: CommunityUser = Depends(require_admin),
):
    session = get_session()
    try:
        regs = session.query(EventRegistration).filter(
            EventRegistration.event_id == event_id
        ).order_by(EventRegistration.registered_at).all()
        return regs
    finally:
        session.close()


# =============================================================================
# QR CHECK-IN
# =============================================================================

@router.get("/{event_id}/qr")
def get_qr_code(
    event_id: UUID,
    current_user: CommunityUser = Depends(require_socio),
):
    """Restituisce il QR code SVG personale per il check-in all'evento."""
    session = get_session()
    try:
        ev = session.query(CommunityEvent).filter(CommunityEvent.id == event_id).first()
        if not ev:
            raise HTTPException(status_code=404, detail="Evento non trovato")

        reg = session.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == current_user.id,
            EventRegistration.stato == "confermata",
        ).first()
        if not reg:
            raise HTTPException(status_code=403, detail="Iscrizione confermata richiesta per il QR")

        # Il payload del QR contiene evento + utente + secret (impedisce QR falsificati)
        payload = f"{event_id}:{current_user.id}:{ev.qr_secret}"

        qr = qrcode.QRCode(image_factory=qrcode.image.svg.SvgImage)
        qr.add_data(payload)
        qr.make(fit=True)
        img = qr.make_image()

        svg_buf = io.BytesIO()
        img.save(svg_buf)
        svg_buf.seek(0)

        return Response(content=svg_buf.read(), media_type="image/svg+xml")
    finally:
        session.close()


@router.post("/{event_id}/checkin", response_model=CheckinOut)
def checkin_qr(
    event_id: UUID,
    user_id: UUID,
    qr_payload: str,
    current_user: CommunityUser = Depends(require_admin),
):
    """Verifica il payload QR e registra il check-in (chiamata dall'admin con scanner)."""
    session = get_session()
    try:
        ev = session.query(CommunityEvent).filter(CommunityEvent.id == event_id).first()
        if not ev:
            raise HTTPException(status_code=404, detail="Evento non trovato")

        expected = f"{event_id}:{user_id}:{ev.qr_secret}"
        if qr_payload != expected:
            raise HTTPException(status_code=400, detail="QR code non valido")

        existing = session.query(EventCheckin).filter(
            EventCheckin.event_id == event_id,
            EventCheckin.user_id == user_id,
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Check-in già effettuato")

        checkin = EventCheckin(event_id=event_id, user_id=user_id, metodo="qr")
        session.add(checkin)
        session.commit()
        session.refresh(checkin)
        return checkin
    finally:
        session.close()


# =============================================================================
# EXPORT PRESENZE
# =============================================================================

@router.get("/{event_id}/export")
def export_presenze(
    event_id: UUID,
    current_user: CommunityUser = Depends(require_admin),
):
    """Esporta CSV con iscritti e stato check-in per rendicontazione APS."""
    session = get_session()
    try:
        ev = session.query(CommunityEvent).filter(CommunityEvent.id == event_id).first()
        if not ev:
            raise HTTPException(status_code=404, detail="Evento non trovato")

        regs = session.query(EventRegistration).filter(
            EventRegistration.event_id == event_id
        ).order_by(EventRegistration.registered_at).all()

        checkins_ids = {
            str(c.user_id)
            for c in session.query(EventCheckin).filter(EventCheckin.event_id == event_id).all()
        }

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "user_id", "nome", "email", "stato_iscrizione", "registrato_il", "check_in"
        ])
        writer.writeheader()

        for r in regs:
            user = session.query(CommunityUser).filter(CommunityUser.id == r.user_id).first()
            writer.writerow({
                "user_id": str(r.user_id),
                "nome": f"{user.nome} {user.cognome or ''}".strip() if user else "",
                "email": user.email if user else "",
                "stato_iscrizione": r.stato,
                "registrato_il": r.registered_at.strftime("%d/%m/%Y %H:%M"),
                "check_in": "SI" if str(r.user_id) in checkins_ids else "NO",
            })

        output.seek(0)
        filename = f"presenze_{ev.titolo[:30].replace(' ', '_')}_{ev.starts_at.strftime('%Y%m%d')}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    finally:
        session.close()
