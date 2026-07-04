"""
Autenticazione JWT per la Community.
Ruoli: guest (non autenticato), socio, admin.
"""

import os
from uuid import UUID
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from community_module.models.community_models import CommunityUser, get_session
from community_module.models.schemas import UserRegister, UserLogin, TokenResponse

SECRET_KEY = os.getenv("COMMUNITY_JWT_SECRET", "fdm-community-secret-2026-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 giorni

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/community/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, ruolo: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": user_id, "ruolo": ruolo, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def _get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[CommunityUser]:
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    session = get_session()
    try:
        return session.query(CommunityUser).filter(
            CommunityUser.id == UUID(user_id),
            CommunityUser.attivo == True
        ).first()
    finally:
        session.close()


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> CommunityUser:
    user = _get_current_user_optional(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticazione richiesta",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[CommunityUser]:
    return _get_current_user_optional(token)


def require_socio(current_user: CommunityUser = Depends(get_current_user)) -> CommunityUser:
    if current_user.ruolo not in ("socio", "admin"):
        raise HTTPException(status_code=403, detail="Accesso riservato ai soci")
    return current_user


def require_admin(current_user: CommunityUser = Depends(get_current_user)) -> CommunityUser:
    if current_user.ruolo != "admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    return current_user


# =============================================================================
# ENDPOINTS AUTH (montati su /community/auth)
# =============================================================================

from fastapi import APIRouter

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/register", response_model=TokenResponse)
def register(data: UserRegister):
    session = get_session()
    try:
        existing = session.query(CommunityUser).filter(CommunityUser.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email già registrata")

        user = CommunityUser(
            email=data.email,
            password_hash=hash_password(data.password),
            nome=data.nome,
            cognome=data.cognome,
            cf_socio=data.cf_socio,
            ruolo="guest",
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        token = create_access_token(str(user.id), user.ruolo)
        return TokenResponse(
            access_token=token,
            ruolo=user.ruolo,
            user_id=str(user.id),
            nome=user.nome,
        )
    finally:
        session.close()


@auth_router.post("/login", response_model=TokenResponse)
def login(data: UserLogin):
    session = get_session()
    try:
        user = session.query(CommunityUser).filter(
            CommunityUser.email == data.email,
            CommunityUser.attivo == True,
        ).first()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Credenziali non valide")

        # Aggiorna last_seen
        user.last_seen = datetime.now(timezone.utc)
        session.commit()

        token = create_access_token(str(user.id), user.ruolo)
        return TokenResponse(
            access_token=token,
            ruolo=user.ruolo,
            user_id=str(user.id),
            nome=user.nome,
        )
    finally:
        session.close()


@auth_router.post("/google-login", response_model=TokenResponse)
def google_login(payload: dict):
    """
    Verifica il Google idToken via Firebase Admin SDK e restituisce un JWT interno.
    Il frontend invia: {"id_token": "<firebase_id_token>"}
    """
    id_token = payload.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="id_token mancante")

    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth, credentials

        if not firebase_admin._apps:
            service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
            if service_account_path:
                cred = credentials.Certificate(service_account_path)
            else:
                cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)

        decoded = firebase_auth.verify_id_token(id_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token Google non valido: {e}")

    email = decoded.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email non presente nel token Google")

    nome_completo = decoded.get("name", email.split("@")[0])
    nome_parts = nome_completo.split(" ", 1)
    nome = nome_parts[0]
    cognome = nome_parts[1] if len(nome_parts) > 1 else None

    session = get_session()
    try:
        user = session.query(CommunityUser).filter(CommunityUser.email == email).first()
        if not user:
            # Genera password placeholder sicura senza passare per passlib/bcrypt
            # Gli utenti Google non useranno mai verify_password
            import hashlib, secrets
            placeholder_hash = "!google:" + hashlib.sha256(secrets.token_bytes(32)).hexdigest()
            user = CommunityUser(
                email=email,
                password_hash=placeholder_hash,
                nome=nome,
                cognome=cognome,
                ruolo="guest",
                verified=True,
                avatar_url=decoded.get("picture"),
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        if not user.attivo:
            raise HTTPException(status_code=403, detail="Account disabilitato")

        user.last_seen = datetime.now(timezone.utc)
        session.commit()

        token = create_access_token(str(user.id), user.ruolo)
        return TokenResponse(
            access_token=token,
            ruolo=user.ruolo,
            user_id=str(user.id),
            nome=user.nome,
        )
    finally:
        session.close()


@auth_router.get("/me")
def me(current_user: CommunityUser = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "nome": current_user.nome,
        "cognome": current_user.cognome,
        "ruolo": current_user.ruolo,
        "verified": current_user.verified,
        "created_at": current_user.created_at.isoformat(),
    }
