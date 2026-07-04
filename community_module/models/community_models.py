"""
SQLAlchemy ORM models per il Community Module.
Usa il database jackass_verona (Cloud SQL PostgreSQL).
"""

import os
from uuid import uuid4
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    create_engine, Column, String, Boolean, Integer, Text,
    DateTime, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, TSVECTOR
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func

Base = declarative_base()


def get_engine():
    db_host = os.getenv("JACKASS_DB_HOST", "35.241.200.140")
    db_port = os.getenv("JACKASS_DB_PORT", "5432")
    db_user = os.getenv("JACKASS_DB_USER", "jackass_admin")
    db_pass = os.getenv("JACKASS_DB_PASSWORD", "")
    db_name = os.getenv("JACKASS_DB_NAME", "jackass_verona")
    url = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=10)


def get_session():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()


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
    stato              = Column(String(20), nullable=False, default="pubblicato")
    creato_da          = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    qr_secret          = Column(String(64), unique=True)
    created_at         = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at         = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())

    registrations = relationship("EventRegistration", back_populates="event")
    checkins      = relationship("EventCheckin", back_populates="event")


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
