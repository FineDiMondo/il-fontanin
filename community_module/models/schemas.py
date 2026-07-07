"""
Pydantic schemas per request/response della Community API.
"""

from uuid import UUID
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field


# =============================================================================
# AUTH / UTENTI
# =============================================================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    nome: str = Field(min_length=2)
    cognome: Optional[str] = None
    cf_socio: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    ruolo: str
    user_id: str
    nome: str

class UserPublic(BaseModel):
    id: UUID
    nome: str
    cognome: Optional[str] = None
    ruolo: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfile(UserPublic):
    email: str
    verified: bool
    last_seen: Optional[datetime] = None


# =============================================================================
# FORUM - CATEGORIE
# =============================================================================

class CategoryOut(BaseModel):
    id: UUID
    nome: str
    slug: str
    descrizione: Optional[str] = None
    pubblica: bool
    ordine: int
    icona: Optional[str] = None

    class Config:
        from_attributes = True


# =============================================================================
# FORUM - THREAD
# =============================================================================

class ThreadCreate(BaseModel):
    category_id: Optional[UUID] = None
    titolo: str = Field(min_length=5, max_length=300)
    corpo: str = Field(min_length=10)

class ThreadOut(BaseModel):
    id: UUID
    category_id: UUID
    titolo: str
    corpo: str
    pinned: bool
    locked: bool
    views: int
    replies_count: int
    last_reply_at: Optional[datetime] = None
    created_at: datetime
    user: UserPublic

    class Config:
        from_attributes = True

class ThreadList(BaseModel):
    id: UUID
    category_id: UUID
    titolo: str
    pinned: bool
    locked: bool
    views: int
    replies_count: int
    last_reply_at: Optional[datetime] = None
    created_at: datetime
    user: UserPublic

    class Config:
        from_attributes = True


# =============================================================================
# FORUM - POST
# =============================================================================

class PostCreate(BaseModel):
    corpo: str = Field(min_length=2)

class PostOut(BaseModel):
    id: UUID
    thread_id: UUID
    corpo: str
    likes: int
    moderato: bool
    created_at: datetime
    edited_at: Optional[datetime] = None
    user: UserPublic

    class Config:
        from_attributes = True


# =============================================================================
# CHAT
# =============================================================================

class RoomOut(BaseModel):
    id: UUID
    nome: str
    slug: str
    descrizione: Optional[str] = None
    tipo: str
    icona: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MessageOut(BaseModel):
    id: UUID
    room_id: UUID
    testo: str
    tipo: str
    edited: bool
    created_at: datetime
    user: UserPublic

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    testo: str = Field(min_length=1, max_length=4000)


# =============================================================================
# RICERCA / ESPERIMENTI
# =============================================================================

class DomandaSurvey(BaseModel):
    id: str
    testo: str
    tipo: str  # testo | scelta_singola | scelta_multipla | scala
    obbligatoria: bool = True
    opzioni: Optional[List[str]] = None
    scala_min: Optional[int] = None
    scala_max: Optional[int] = None

class ExperimentCreate(BaseModel):
    titolo: str = Field(min_length=5)
    descrizione: Optional[str] = None
    tipo: str = "sondaggio"
    anonimo: bool = False
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None

class ExperimentOut(BaseModel):
    id: UUID
    titolo: str
    descrizione: Optional[str] = None
    tipo: str
    stato: str
    anonimo: bool
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SurveyCreate(BaseModel):
    titolo: str
    domande: List[DomandaSurvey]

class SurveyOut(BaseModel):
    id: UUID
    experiment_id: UUID
    titolo: str
    domande_json: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

class SurveyResponseSubmit(BaseModel):
    risposte: Dict[str, Any]  # {question_id: risposta}
    token_anonimo: Optional[str] = None


# =============================================================================
# EVENTI
# =============================================================================

class EventCreate(BaseModel):
    titolo: str = Field(min_length=5)
    descrizione: Optional[str] = None
    luogo: Optional[str] = None
    luogo_online: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    max_partecipanti: Optional[int] = None
    pubblico: bool = True

class EventOut(BaseModel):
    id: UUID
    titolo: str
    descrizione: Optional[str] = None
    luogo: Optional[str] = None
    luogo_online: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    max_partecipanti: Optional[int] = None
    pubblico: bool
    stato: str
    created_at: datetime
    posti_disponibili: Optional[int] = None
    iscritti: int = 0

    class Config:
        from_attributes = True

class RegistrationOut(BaseModel):
    id: UUID
    event_id: UUID
    stato: str
    registered_at: datetime
    user: UserPublic

    class Config:
        from_attributes = True

class CheckinOut(BaseModel):
    event_id: UUID
    user_id: UUID
    checked_in_at: datetime
    metodo: str

    class Config:
        from_attributes = True

class LavoriCreate(BaseModel):
    titolo: str
    descrizione: Optional[str] = None
    tipo: str
    lat: Optional[str] = None
    lng: Optional[str] = None
    attrezzi: Optional[Dict[str, Any]] = None
    video_url: Optional[str] = None
    immagini: Optional[List[str]] = None
    note: Optional[str] = None

class LavoriUpdate(BaseModel):
    titolo: Optional[str] = None
    descrizione: Optional[str] = None
    stato: Optional[str] = None
    data_inizio: Optional[datetime] = None
    data_fine: Optional[datetime] = None
    attrezzi: Optional[Dict[str, Any]] = None
    video_url: Optional[str] = None
    immagini: Optional[List[str]] = None
    note: Optional[str] = None

class LavoriOut(BaseModel):
    id: UUID
    titolo: str
    descrizione: Optional[str] = None
    tipo: str
    stato: str
    lat: Optional[str] = None
    lng: Optional[str] = None
    attrezzi: Optional[Dict[str, Any]] = None
    video_url: Optional[str] = None
    immagini: Optional[List[str]] = None
    note: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# NOTIFICHE
# =============================================================================

class NotificationOut(BaseModel):
    id: UUID
    tipo: str
    titolo: str
    corpo: Optional[str] = None
    letta: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# GENERICI
# =============================================================================

class MessageResponse(BaseModel):
    message: str
    success: bool = True

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int

# =============================================================================
# CANZONIERE
# =============================================================================

class CanzoniereBranoCreate(BaseModel):
    titolo: str = Field(min_length=2)
    autore: Optional[str] = None
    tipo: str = "autore"
    tonalita_originale: Optional[str] = None
    capotasto: int = 0
    tempo_bpm: Optional[int] = None
    ritmo_strumming: Optional[str] = None
    testo_accordi: str = Field(min_length=10)
    fonte: str = "manuale"
    fonte_url: Optional[str] = None
    licenza: Optional[str] = None

class CanzoniereBranoOut(BaseModel):
    id: UUID
    titolo: str
    autore: Optional[str] = None
    tipo: str
    tonalita_originale: Optional[str] = None
    capotasto: int
    tempo_bpm: Optional[int] = None
    ritmo_strumming: Optional[str] = None
    testo_accordi: str
    fonte: str
    fonte_url: Optional[str] = None
    licenza: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    versione: int
    creato_da: UUID

    class Config:
        from_attributes = True

class CanzoniereRaccoltaCreate(BaseModel):
    nome: str = Field(min_length=2)
    descrizione: Optional[str] = None
    pubblica: bool = False

class CanzoniereRaccoltaOut(BaseModel):
    id: UUID
    nome: str
    descrizione: Optional[str] = None
    pubblica: bool
    created_at: datetime
    creato_da: UUID

    class Config:
        from_attributes = True


# =============================================================================
# RICETTARIO
# =============================================================================

class IngredienteStrutturato(BaseModel):
    nome: str = Field(min_length=2)
    quantita: Optional[float] = None
    unita: Optional[str] = None
    opzionale: bool = False
    note: Optional[str] = None

class RicettarioRicettaCreate(BaseModel):
    nome: str = Field(min_length=2)
    categoria: Optional[str] = None
    tipo_cucina: Optional[str] = None
    porzioni_base: int = 4
    tempo_prep_min: Optional[int] = None
    tempo_cottura_min: Optional[int] = None
    difficolta: Optional[str] = None
    procedimento: List[str]
    tag_dietetici: Optional[List[str]] = None
    ingredienti: List[IngredienteStrutturato]
    fonte: str = "manuale"
    fonte_url: Optional[str] = None
    licenza: Optional[str] = None
    foto_drive_id: Optional[str] = None

class RicettarioRicettaOut(BaseModel):
    id: UUID
    nome: str
    categoria: Optional[str] = None
    tipo_cucina: Optional[str] = None
    porzioni_base: int
    tempo_prep_min: Optional[int] = None
    tempo_cottura_min: Optional[int] = None
    difficolta: Optional[str] = None
    procedimento: List[str]
    tag_dietetici: Optional[List[str]] = None
    fonte: str
    fonte_url: Optional[str] = None
    licenza: Optional[str] = None
    foto_drive_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    versione: int
    creato_da: UUID
    ingredienti: Optional[List[Dict[str, Any]]] = None # per output arricchito

    class Config:
        from_attributes = True

class RicettarioRaccoltaCreate(BaseModel):
    nome: str = Field(min_length=2)
    descrizione: Optional[str] = None
    pubblica: bool = False

class RicettarioRaccoltaOut(BaseModel):
    id: UUID
    nome: str
    descrizione: Optional[str] = None
    pubblica: bool
    created_at: datetime
    creato_da: UUID

    class Config:
        from_attributes = True
