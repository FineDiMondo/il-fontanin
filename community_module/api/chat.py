"""
Chat real-time via WebSocket per i soci.
Pattern adattato da KYUSS_RETRO/app/websocket.py.
"""

import json
import asyncio
import logging
from uuid import UUID
from typing import Dict, List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query
from fastapi.security import OAuth2PasswordBearer

from community_module.models.community_models import (
    get_session, CommunityUser, ChatRoom, ChatMessage, ChatMembership
)
from community_module.models.schemas import RoomOut, MessageOut, MessageCreate
from community_module.auth.community_auth import decode_token, require_socio, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


# =============================================================================
# MANAGER WEBSOCKET (in-memory, per istanza Cloud Run)
# =============================================================================

class ChatRoomManager:
    def __init__(self):
        # room_id -> {user_id: WebSocket}
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}
        self.user_names: Dict[str, Dict[str, str]] = {}  # room_id -> {user_id: nome}
        self.lock = asyncio.Lock()

    async def connect(self, room_id: str, user_id: str, nome: str, ws: WebSocket):
        await ws.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
            self.user_names[room_id] = {}
        self.rooms[room_id][user_id] = ws
        self.user_names[room_id][user_id] = nome
        await self._broadcast(room_id, {
            "tipo": "utente_entrato",
            "user_id": user_id,
            "nome": nome,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }, exclude=user_id)
        # Invia lista utenti online al nuovo
        await ws.send_json({
            "tipo": "stato_iniziale",
            "utenti_online": [
                {"user_id": uid, "nome": n}
                for uid, n in self.user_names.get(room_id, {}).items()
                if uid != user_id
            ],
        })

    async def disconnect(self, room_id: str, user_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].pop(user_id, None)
            nome = self.user_names.get(room_id, {}).pop(user_id, "")
            if not self.rooms[room_id]:
                del self.rooms[room_id]
                self.user_names.pop(room_id, None)
            else:
                await self._broadcast(room_id, {
                    "tipo": "utente_uscito",
                    "user_id": user_id,
                    "nome": nome,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    async def _broadcast(self, room_id: str, message: dict, exclude: Optional[str] = None):
        stale = []
        for uid, ws in self.rooms.get(room_id, {}).items():
            if uid == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                stale.append(uid)
        for uid in stale:
            await self.disconnect(room_id, uid)

    async def broadcast_message(self, room_id: str, message: dict):
        await self._broadcast(room_id, message)


chat_manager = ChatRoomManager()


# =============================================================================
# REST ENDPOINTS
# =============================================================================

@router.get("/rooms", response_model=List[RoomOut])
def list_rooms(current_user: CommunityUser = Depends(require_socio)):
    session = get_session()
    try:
        rooms = session.query(ChatRoom).filter(
            ChatRoom.tipo.in_(["pubblica", "evento"])
        ).all()
        return rooms
    finally:
        session.close()


@router.get("/rooms/{room_slug}/messages", response_model=List[MessageOut])
def get_messages(
    room_slug: str,
    limit: int = Query(50, ge=1, le=200),
    current_user: CommunityUser = Depends(require_socio),
):
    session = get_session()
    try:
        room = session.query(ChatRoom).filter(ChatRoom.slug == room_slug).first()
        if not room:
            raise HTTPException(status_code=404, detail="Stanza non trovata")

        messages = (
            session.query(ChatMessage)
            .filter(ChatMessage.room_id == room.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
            .all()
        )
        return list(reversed(messages))
    finally:
        session.close()


@router.post("/rooms/{room_slug}/messages", response_model=MessageOut)
def post_message(
    room_slug: str,
    data: MessageCreate,
    current_user: CommunityUser = Depends(require_socio),
):
    """Invia un messaggio via REST (alternativa al WebSocket)."""
    session = get_session()
    try:
        room = session.query(ChatRoom).filter(ChatRoom.slug == room_slug).first()
        if not room:
            raise HTTPException(status_code=404, detail="Stanza non trovata")

        msg = ChatMessage(
            room_id=room.id,
            user_id=current_user.id,
            testo=data.testo,
        )
        session.add(msg)
        session.commit()
        session.refresh(msg)
        return msg
    finally:
        session.close()


# =============================================================================
# WEBSOCKET ENDPOINT
# =============================================================================

@router.websocket("/ws/{room_slug}")
async def websocket_chat(room_slug: str, ws: WebSocket, token: Optional[str] = Query(None)):
    """
    WebSocket per chat real-time.
    Autenticazione via query param: ?token=<jwt>
    Solo soci possono connettersi.

    Messaggi in entrata:
      {"tipo": "messaggio", "testo": "..."}
      {"tipo": "digitando"}

    Messaggi in uscita:
      {"tipo": "messaggio", "id": ..., "testo": ..., "user_id": ..., "nome": ..., "timestamp": ...}
      {"tipo": "digitando", "user_id": ..., "nome": ...}
      {"tipo": "utente_entrato", ...}
      {"tipo": "utente_uscito", ...}
    """
    # Verifica token
    payload = decode_token(token) if token else None
    if not payload:
        await ws.close(code=4001)
        return

    session = get_session()
    try:
        user = session.query(CommunityUser).filter(
            CommunityUser.id == UUID(payload["sub"]),
            CommunityUser.attivo == True,
        ).first()
        if not user or user.ruolo == "guest":
            await ws.close(code=4003)
            return

        room = session.query(ChatRoom).filter(ChatRoom.slug == room_slug).first()
        if not room:
            await ws.close(code=4004)
            return

        room_id = str(room.id)
        user_id = str(user.id)
        nome = user.nome

        # Aggiorna membership
        membership = session.query(ChatMembership).filter(
            ChatMembership.user_id == user.id,
            ChatMembership.room_id == room.id,
        ).first()
        if not membership:
            m = ChatMembership(user_id=user.id, room_id=room.id)
            session.add(m)
            session.commit()
    finally:
        session.close()

    await chat_manager.connect(room_id, user_id, nome, ws)

    try:
        while True:
            raw = await ws.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            tipo = data.get("tipo")

            if tipo == "messaggio":
                testo = (data.get("testo") or "").strip()
                if not testo or len(testo) > 4000:
                    continue

                # Persisti nel DB
                db = get_session()
                try:
                    msg = ChatMessage(
                        room_id=UUID(room_id),
                        user_id=UUID(user_id),
                        testo=testo,
                    )
                    db.add(msg)
                    db.commit()
                    msg_id = str(msg.id)
                    created_at = msg.created_at.isoformat()
                finally:
                    db.close()

                await chat_manager.broadcast_message(room_id, {
                    "tipo": "messaggio",
                    "id": msg_id,
                    "testo": testo,
                    "user_id": user_id,
                    "nome": nome,
                    "timestamp": created_at,
                })

            elif tipo == "digitando":
                await chat_manager._broadcast(room_id, {
                    "tipo": "digitando",
                    "user_id": user_id,
                    "nome": nome,
                }, exclude=user_id)

    except WebSocketDisconnect:
        await chat_manager.disconnect(room_id, user_id)
    except Exception as e:
        logger.error(f"WebSocket chat error user {user_id}: {e}")
        await chat_manager.disconnect(room_id, user_id)
