"""
SQLAlchemy ORM models per il Community Module.
Usa il database jackass_verona (Cloud SQL PostgreSQL).
"""

import os
from uuid import uuid4
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    create_engine, Column, String, Boolean, Integer, Text, Numeric, Date,
    DateTime, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, TSVECTOR
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func

Base = declarative_base()


_engine = None
_Session = None

def get_engine():
    global _engine
    if _engine is None:
        db_host = os.getenv("JACKASS_DB_HOST", "35.241.200.140")
        db_port = os.getenv("JACKASS_DB_PORT", "5432")
        db_user = os.getenv("JACKASS_DB_USER", "jackass_admin")
        db_pass = os.getenv("JACKASS_DB_PASSWORD", "")
        db_name = os.getenv("JACKASS_DB_NAME", "jackass_verona")
        url = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
        _engine = create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=10)
    return _engine


def get_session():
    global _Session
    if _Session is None:
        _Session = sessionmaker(bind=get_engine())
    return _Session()


# =============================================================================
# UTENTI
# =============================================================================

class CommunityUser(Base):
    __tablename__ = "community_users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email         = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nome          = Column(String(100), nullable=False)
    cognome       = Column(String(100))
    ruolo         = Column(String(20), nullable=False, default="guest")
    cf_socio      = Column(String(16))
    bio           = Column(Text)
    avatar_url    = Column(String(500))
    verified      = Column(Boolean, nullable=False, default=False)
    attivo        = Column(Boolean, nullable=False, default=True)
    last_seen     = Column(DateTime(timezone=True))
    created_at    = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at    = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    threads       = relationship("ForumThread", back_populates="user")
    posts         = relationship("ForumPost", back_populates="user")
    registrations = relationship("EventRegistration", back_populates="user")


# =============================================================================
# FORUM
# =============================================================================

class ForumCategory(Base):
    __tablename__ = "forum_categories"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    nome        = Column(String(100), nullable=False)
    slug        = Column(String(100), unique=True, nullable=False)
    descrizione = Column(Text)
    pubblica    = Column(Boolean, nullable=False, default=True)
    ordine      = Column(Integer, nullable=False, default=0)
    icona       = Column(String(50))
    created_at  = Column(DateTime(timezone=True), nullable=False, default=func.now())

    threads     = relationship("ForumThread", back_populates="category")


class ForumThread(Base):
    __tablename__ = "forum_threads"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    category_id   = Column(UUID(as_uuid=True), ForeignKey("forum_categories.id", ondelete="CASCADE"), nullable=False)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("community_users.id", ondelete="CASCADE"), nullable=False)
    titolo        = Column(String(300), nullable=False)
    corpo         = Column(Text, nullable=False)
    pinned        = Column(Boolean, nullable=False, default=False)
    locked        = Column(Boolean, nullable=False, default=False)
    views         = Column(Integer, nullable=False, default=0)
    replies_count = Column(Integer, nullable=False, default=0)
    last_reply_at = Column(DateTime(timezone=True))
    search_vector = Column(TSVECTOR)
    created_at    = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at    = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    category = relationship("ForumCategory", back_populates="threads")
    user     = relationship("CommunityUser", back_populates="threads")
    posts    = relationship("ForumPost", back_populates="thread")


class ForumPost(Base):
    __tablename__ = "forum_posts"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    thread_id          = Column(UUID(as_uuid=True), ForeignKey("forum_threads.id", ondelete="CASCADE"), nullable=False)
    user_id            = Column(UUID(as_uuid=True), ForeignKey("community_users.id", ondelete="CASCADE"), nullable=False)
    corpo              = Column(Text, nullable=False)
    likes              = Column(Integer, nullable=False, default=0)
    moderato           = Column(Boolean, nullable=False, default=False)
    motivo_moderazione = Column(Text)
    created_at         = Column(DateTime(timezone=True), nullable=False, default=func.now())
    edited_at          = Column(DateTime(timezone=True))

    thread = relationship("ForumThread", back_populates="posts")
    user   = relationship("CommunityUser", back_populates="posts")


class ForumPostLike(Base):
    __tablename__ = "forum_post_likes"
    __table_args__ = (UniqueConstraint("post_id", "user_id"),)

    post_id    = Column(UUID(as_uuid=True), ForeignKey("forum_posts.id", ondelete="CASCADE"), primary_key=True)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("community_users.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())


# =============================================================================
# CHAT
# =============================================================================

class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    nome        = Column(String(100), nullable=False)
    slug        = Column(String(100), unique=True, nullable=False)
    descrizione = Column(Text)
    tipo        = Column(String(20), nullable=False, default="pubblica")
    icona       = Column(String(50))
    created_by  = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    created_at  = Column(DateTime(timezone=True), nullable=False, default=func.now())

    messages    = relationship("ChatMessage", back_populates="room")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    room_id    = Column(UUID(as_uuid=True), ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("community_users.id", ondelete="CASCADE"), nullable=False)
    testo      = Column(Text, nullable=False)
    tipo       = Column(String(20), nullable=False, default="testo")
    meta_data  = Column("metadata", JSONB)
    edited     = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())

    room = relationship("ChatRoom", back_populates="messages")
    user = relationship("CommunityUser")


class ChatMembership(Base):
    __tablename__ = "chat_memberships"
    __table_args__ = (UniqueConstraint("user_id", "room_id"),)

    user_id   = Column(UUID(as_uuid=True), ForeignKey("community_users.id", ondelete="CASCADE"), primary_key=True)
    room_id   = Column(UUID(as_uuid=True), ForeignKey("chat_rooms.id", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    last_read = Column(DateTime(timezone=True))


# =============================================================================
# RICERCA / ESPERIMENTI
# =============================================================================

class ResearchExperiment(Base):
    __tablename__ = "research_experiments"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    titolo      = Column(String(200), nullable=False)
    descrizione = Column(Text)
    tipo        = Column(String(50), nullable=False, default="sondaggio")
    stato       = Column(String(20), nullable=False, default="bozza")
    creato_da   = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    anonimo     = Column(Boolean, nullable=False, default=False)
    starts_at   = Column(DateTime(timezone=True))
    ends_at     = Column(DateTime(timezone=True))
    created_at  = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at  = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    surveys     = relationship("ResearchSurvey", back_populates="experiment")


class ResearchSurvey(Base):
    __tablename__ = "research_surveys"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    experiment_id = Column(UUID(as_uuid=True), ForeignKey("research_experiments.id", ondelete="CASCADE"), nullable=False)
    titolo        = Column(String(200), nullable=False)
    domande_json  = Column(JSONB, nullable=False)
    created_at    = Column(DateTime(timezone=True), nullable=False, default=func.now())

    experiment = relationship("ResearchExperiment", back_populates="surveys")
    responses  = relationship("ResearchResponse", back_populates="survey")


class ResearchResponse(Base):
    __tablename__ = "research_responses"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    survey_id      = Column(UUID(as_uuid=True), ForeignKey("research_surveys.id", ondelete="CASCADE"), nullable=False)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    token_anonimo  = Column(String(64))
    risposte_json  = Column(JSONB, nullable=False)
    ip_hash        = Column(String(64))
    submitted_at   = Column(DateTime(timezone=True), nullable=False, default=func.now())

    survey = relationship("ResearchSurvey", back_populates="responses")


class ResearchObservation(Base):
    __tablename__ = "research_observations"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    experiment_id = Column(UUID(as_uuid=True), ForeignKey("research_experiments.id", ondelete="CASCADE"), nullable=False)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    dati_json     = Column(JSONB, nullable=False)
    note          = Column(Text)
    recorded_at   = Column(DateTime(timezone=True), nullable=False, default=func.now())


# =============================================================================
# EVENTI
# =============================================================================

class CommunityEvent(Base):
    __tablename__ = "community_events"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    titolo             = Column(String(200), nullable=False)
    descrizione        = Column(Text)
    luogo              = Column(String(300))
    luogo_online       = Column(String(500))
    starts_at          = Column(DateTime(timezone=True), nullable=False)
    ends_at            = Column(DateTime(timezone=True))
    max_partecipanti   = Column(Integer)
    pubblico           = Column(Boolean, nullable=False, default=True)
    stato              = Column(String(20), nullable=False, default="bozza")
    creato_da          = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    qr_secret          = Column(String(64), unique=True)
    validato_da        = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    validato_at        = Column(DateTime(timezone=True))
    nota_validazione   = Column(Text)
    created_at         = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at         = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    registrations = relationship("EventRegistration", back_populates="event")
    checkins      = relationship("EventCheckin", back_populates="event")
    schede_catalogo = relationship("CommunityEventCatalogoScheda", back_populates="event", cascade="all, delete-orphan")

class CommunityEventCatalogoScheda(Base):
    __tablename__ = "community_event_catalogo_schede"
    __table_args__ = (
        UniqueConstraint("event_id", "scheda_id", name="uq_event_scheda"),
        Index("ix_event_schede_event", "event_id"),
        Index("ix_event_schede_scheda", "scheda_id"),
    )

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_id   = Column(UUID(as_uuid=True), ForeignKey("community_events.id", ondelete="CASCADE"), nullable=False)
    scheda_id  = Column(UUID(as_uuid=True), ForeignKey("catalogo_schede.id", ondelete="RESTRICT"), nullable=False)
    ordine     = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())

    event      = relationship("CommunityEvent", back_populates="schede_catalogo")
    scheda     = relationship("CatalogoScheda")


class EventRegistration(Base):
    __tablename__ = "event_registrations"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_id      = Column(UUID(as_uuid=True), ForeignKey("community_events.id", ondelete="CASCADE"), nullable=False)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("community_users.id", ondelete="CASCADE"), nullable=False)
    stato         = Column(String(20), nullable=False, default="confermata")
    note          = Column(Text)
    registered_at = Column(DateTime(timezone=True), nullable=False, default=func.now())

    event = relationship("CommunityEvent", back_populates="registrations")
    user  = relationship("CommunityUser", back_populates="registrations")


class EventCheckin(Base):
    __tablename__ = "event_checkins"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_id      = Column(UUID(as_uuid=True), ForeignKey("community_events.id", ondelete="CASCADE"), nullable=False)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("community_users.id", ondelete="CASCADE"), nullable=False)
    checked_in_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    metodo        = Column(String(20), nullable=False, default="qr")

    event = relationship("CommunityEvent", back_populates="checkins")


class LavoriProgetto(Base):
    __tablename__ = "lavori_progetti"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    titolo      = Column(String(200), nullable=False)
    descrizione = Column(Text)
    tipo        = Column(String(50), nullable=False)  # 'scaletta', 'argine', 'piscinetta'
    stato       = Column(String(20), nullable=False, default="pianificato")  # pianificato, in_corso, completato
    data_inizio = Column(DateTime(timezone=True))
    data_fine   = Column(DateTime(timezone=True))
    
    # Geolocalizzazione
    lat         = Column(String(20))  # Salva come stringa per semplicità
    lng         = Column(String(20))
    
    # Metadata
    attrezzi    = Column(JSONB)  # {"cariola": True, "pala": True, ...}
    video_url   = Column(String(500))
    immagini    = Column(JSONB)  # Lista di URL
    note        = Column(Text)
    
    created_by  = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    created_at  = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at  = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    creator     = relationship("CommunityUser")


# =============================================================================
# NOTIFICHE
# =============================================================================

class CommunityNotification(Base):
    __tablename__ = "community_notifications"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("community_users.id", ondelete="CASCADE"), nullable=False)
    tipo       = Column(String(50), nullable=False)
    titolo     = Column(String(200), nullable=False)
    corpo      = Column(Text)
    letta      = Column(Boolean, nullable=False, default=False)
    link       = Column(String(500))
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())

# =============================================================================
# CANZONIERE
# =============================================================================

class CanzoniereBrano(Base):
    __tablename__ = "canzoniere_brani"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    titolo             = Column(String(200), nullable=False)
    autore             = Column(String(200))
    tipo               = Column(String(50), nullable=False, default="autore") # tradizionale, autore, cover
    tonalita_originale = Column(String(10))
    capotasto          = Column(Integer, default=0)
    tempo_bpm          = Column(Integer)
    ritmo_strumming    = Column(Text)
    testo_accordi      = Column(Text, nullable=False) # Markdown/ChordPro
    fonte              = Column(String(50), default="manuale")
    fonte_url          = Column(String(500))
    licenza            = Column(String(50))
    
    creato_da          = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    modificato_da      = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    created_at         = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at         = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    versione           = Column(Integer, nullable=False, default=1)

class CanzoniereVersione(Base):
    __tablename__ = "canzoniere_versioni"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    brano_id           = Column(UUID(as_uuid=True), ForeignKey("canzoniere_brani.id", ondelete="CASCADE"), nullable=False)
    versione           = Column(Integer, nullable=False)
    contenuto_testo    = Column(Text, nullable=False)
    modificato_da      = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    created_at         = Column(DateTime(timezone=True), nullable=False, default=func.now())

class CanzoniereRaccolta(Base):
    __tablename__ = "canzoniere_raccolte"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    nome        = Column(String(200), nullable=False)
    descrizione = Column(Text)
    pubblica    = Column(Boolean, nullable=False, default=False)
    creato_da   = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    created_at  = Column(DateTime(timezone=True), nullable=False, default=func.now())

class CanzoniereRaccoltaBrano(Base):
    __tablename__ = "canzoniere_raccolte_brani"
    __table_args__ = (UniqueConstraint("raccolta_id", "brano_id"),)

    raccolta_id = Column(UUID(as_uuid=True), ForeignKey("canzoniere_raccolte.id", ondelete="CASCADE"), primary_key=True)
    brano_id    = Column(UUID(as_uuid=True), ForeignKey("canzoniere_brani.id", ondelete="CASCADE"), primary_key=True)
    ordine      = Column(Integer, nullable=False, default=0)


# =============================================================================
# RICETTARIO
# =============================================================================

class RicettarioRicetta(Base):
    __tablename__ = "ricettario_ricette"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    nome              = Column(String(200), nullable=False)
    categoria         = Column(String(100))
    tipo_cucina       = Column(String(100))
    porzioni_base     = Column(Integer, nullable=False, default=4)
    tempo_prep_min    = Column(Integer)
    tempo_cottura_min = Column(Integer)
    difficolta        = Column(String(50)) # Facile, Media, Complessa
    procedimento      = Column(JSONB, nullable=False) # Array di step strutturati
    tag_dietetici     = Column(JSONB) # Array di stringhe
    
    fonte             = Column(String(50), default="manuale")
    fonte_url         = Column(String(500))
    licenza           = Column(String(100))
    foto_drive_id     = Column(String(200))
    
    creato_da         = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    modificato_da     = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    created_at        = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at        = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    versione          = Column(Integer, nullable=False, default=1)

class RicettarioIngrediente(Base):
    __tablename__ = "ricettario_ingredienti"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    ricetta_id = Column(UUID(as_uuid=True), ForeignKey("ricettario_ricette.id", ondelete="CASCADE"), nullable=False)
    nome       = Column(String(200), nullable=False)
    quantita   = Column(Numeric(10, 2))
    unita      = Column(String(50))
    opzionale  = Column(Boolean, default=False)
    note       = Column(String(200))
    ordine     = Column(Integer, default=0)

class RicettarioVersione(Base):
    __tablename__ = "ricettario_versioni"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    ricetta_id         = Column(UUID(as_uuid=True), ForeignKey("ricettario_ricette.id", ondelete="CASCADE"), nullable=False)
    versione           = Column(Integer, nullable=False)
    contenuto_json     = Column(JSONB, nullable=False)
    modificato_da      = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    created_at         = Column(DateTime(timezone=True), nullable=False, default=func.now())

class RicettarioRaccolta(Base):
    __tablename__ = "ricettario_raccolte"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    nome        = Column(String(200), nullable=False)
    descrizione = Column(Text)
    pubblica    = Column(Boolean, nullable=False, default=False)
    creato_da   = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    created_at  = Column(DateTime(timezone=True), nullable=False, default=func.now())

class RicettarioRaccoltaRicetta(Base):
    __tablename__ = "ricettario_raccolte_ricette"
    __table_args__ = (UniqueConstraint("raccolta_id", "ricetta_id"),)

    raccolta_id = Column(UUID(as_uuid=True), ForeignKey("ricettario_raccolte.id", ondelete="CASCADE"), primary_key=True)
    ricetta_id  = Column(UUID(as_uuid=True), ForeignKey("ricettario_ricette.id", ondelete="CASCADE"), primary_key=True)
    ordine      = Column(Integer, nullable=False, default=0)

# =============================================================================
# STRUTTURA REGNI / YGGDRASIL
# =============================================================================

class StrutturaRegno(Base):
    __tablename__ = "struttura_regni"

    codice      = Column(String(40), primary_key=True)  # vanaheim, jotunheim, ...
    nome        = Column(String(100), nullable=False)
    descrizione = Column(Text)
    ordine      = Column(Integer, nullable=False, unique=True)
    navigabile  = Column(Boolean, nullable=False, default=True)
    tema_json   = Column(JSONB)  # SOLO tema grafico: colore, icona
    attivo      = Column(Boolean, nullable=False, default=True)
    created_at  = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at  = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    categorie   = relationship("StrutturaRegnoCategoria", back_populates="regno")


class StrutturaRegnoCategoria(Base):
    __tablename__ = "struttura_regno_categorie"
    __table_args__ = (
        UniqueConstraint("categoria_id", name="uq_regno_categoria_categoria_unica"),
        Index("ix_regno_categorie_regno", "regno_codice"),
    )

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    regno_codice  = Column(String(40), ForeignKey("struttura_regni.codice", ondelete="CASCADE"), nullable=False)
    categoria_id  = Column(UUID(as_uuid=True), ForeignKey("catalogo_categorie.id", ondelete="CASCADE"), nullable=False)
    ordine        = Column(Integer, nullable=False, default=0)
    created_at    = Column(DateTime(timezone=True), nullable=False, default=func.now())

    regno         = relationship("StrutturaRegno", back_populates="categorie")
    categoria     = relationship("CatalogoCategoria")


# =============================================================================
# CATALOGAZIONE TERRITORIALE
# =============================================================================

class CatalogoCategoria(Base):
    __tablename__ = "catalogo_categorie"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    codice          = Column(String(50), unique=True, nullable=False)
    nome            = Column(String(100), nullable=False)
    metadata_schema = Column(JSONB)
    attivo          = Column(Boolean, nullable=False, default=True)
    created_at      = Column(DateTime(timezone=True), nullable=False, default=func.now())

    sottocategorie  = relationship("CatalogoSottocategoria", back_populates="categoria")

class CatalogoSottocategoria(Base):
    __tablename__ = "catalogo_sottocategorie"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    categoria_id = Column(UUID(as_uuid=True), ForeignKey("catalogo_categorie.id", ondelete="CASCADE"), nullable=False)
    codice       = Column(String(50), nullable=False)
    nome         = Column(String(100), nullable=False)
    ordine       = Column(Integer, nullable=False, default=0)

    categoria    = relationship("CatalogoCategoria", back_populates="sottocategorie")

class CatalogoScheda(Base):
    __tablename__ = "catalogo_schede"

    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    categoria_id          = Column(UUID(as_uuid=True), ForeignKey("catalogo_categorie.id"), nullable=False)
    sottocategoria_id     = Column(UUID(as_uuid=True), ForeignKey("catalogo_sottocategorie.id"))
    nome                  = Column(String(200), nullable=False)
    lat                   = Column(Numeric(9, 6), nullable=False)
    lng                   = Column(Numeric(9, 6), nullable=False)
    descrizione           = Column(Text)
    cronologia_storica    = Column(Text)
    is_segnaposto         = Column(Boolean, nullable=False, default=False)
    
    evidenza_livello      = Column(String(1)) # 'C'|'D'|'I'|'L'
    evidenza_fonte        = Column(Text)
    evidenza_data_verifica= Column(Date)
    metadata_specifici    = Column(JSONB)
    
    stato                 = Column(String(20), nullable=False, default="bozza")
    scheda_precedente_id  = Column(UUID(as_uuid=True), ForeignKey("catalogo_schede.id"))
    
    creato_da             = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    validato_da           = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    validato_at           = Column(DateTime(timezone=True))
    nota_validazione      = Column(Text)
    
    created_at            = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at            = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    categoria             = relationship("CatalogoCategoria")
    media                 = relationship("CatalogoMedia", back_populates="scheda")

class CatalogoMedia(Base):
    __tablename__ = "catalogo_media"

    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    scheda_id             = Column(UUID(as_uuid=True), ForeignKey("catalogo_schede.id", ondelete="CASCADE"), nullable=False)
    tipo                  = Column(String(20), nullable=False) # foto|video|documento
    modalita_acquisizione = Column(String(20), nullable=False, default="upload_server")
    url_esterno           = Column(Text)
    drive_file_id         = Column(String(200))
    nome_file             = Column(String(300))
    descrizione           = Column(Text)
    uploaded_by           = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    created_at            = Column(DateTime(timezone=True), nullable=False, default=func.now())

    scheda                = relationship("CatalogoScheda", back_populates="media")

# =============================================================================
# COMPETENZE E VALIDATORI
# =============================================================================

class CompetenzaDominio(Base):
    __tablename__ = "competenza_domini"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    codice       = Column(String(50), unique=True, nullable=False)   # es. "monumenti-cristiani"
    nome         = Column(String(100), nullable=False)
    descrizione  = Column(Text)
    domande_json = Column(JSONB, nullable=False)   # lista {id, testo, tipo, opzioni?, scala_min?, scala_max?}
    attivo       = Column(Boolean, nullable=False, default=True)
    created_by   = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    created_at   = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at   = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

class CompetenzaUtente(Base):
    __tablename__ = "competenza_utente"
    __table_args__ = (UniqueConstraint("user_id", "dominio_id"),)

    id                     = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id                = Column(UUID(as_uuid=True), ForeignKey("community_users.id", ondelete="CASCADE"), nullable=False)
    dominio_id             = Column(UUID(as_uuid=True), ForeignKey("competenza_domini.id", ondelete="CASCADE"), nullable=False)
    livello_dichiarato     = Column(String(20), nullable=False, default="nessuna")  # nessuna|base|intermedia|esperta
    livello_validato       = Column(String(20))  # stessa scala, null finché non validato
    validato_da            = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    validato_at            = Column(DateTime(timezone=True))
    fonte                  = Column(Text)   # es. "storico dell'arte", "archivista", "interesse personale"
    risposte_json          = Column(JSONB)  # risposte al questionario di dominio
    data_ultima_revisione  = Column(DateTime(timezone=True), nullable=False, default=func.now())
    created_at             = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at             = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())


