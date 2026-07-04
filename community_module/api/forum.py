"""
API Forum: categorie, thread, post, like, ricerca full-text.
Categorie pubbliche: lettura libera, scrittura solo soci.
Categorie private: solo soci.
"""

import math
from uuid import UUID
from typing import Optional, List
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import text

from community_module.models.community_models import (
    get_session, CommunityUser,
    ForumCategory, ForumThread, ForumPost, ForumPostLike, CommunityNotification
)
from community_module.models.schemas import (
    ThreadCreate, ThreadOut, ThreadList,
    PostCreate, PostOut, CategoryOut, MessageResponse
)
from community_module.auth.community_auth import (
    get_current_user, get_current_user_optional, require_socio
)

router = APIRouter(prefix="/forum", tags=["forum"])


# =============================================================================
# CATEGORIE
# =============================================================================

@router.get("/categories", response_model=List[CategoryOut])
def list_categories(current_user: Optional[CommunityUser] = Depends(get_current_user_optional)):
    session = get_session()
    try:
        q = session.query(ForumCategory).order_by(ForumCategory.ordine)
        if not current_user or current_user.ruolo == "guest":
            q = q.filter(ForumCategory.pubblica == True)
        return q.all()
    finally:
        session.close()


# =============================================================================
# THREAD
# =============================================================================

@router.get("/categories/{category_slug}/threads", response_model=List[ThreadList])
def list_threads(
    category_slug: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    session = get_session()
    try:
        cat = session.query(ForumCategory).filter(ForumCategory.slug == category_slug).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Categoria non trovata")
        if not cat.pubblica and (not current_user or current_user.ruolo == "guest"):
            raise HTTPException(status_code=403, detail="Categoria riservata ai soci")

        q = (
            session.query(ForumThread)
            .filter(ForumThread.category_id == cat.id)
            .order_by(ForumThread.pinned.desc(), ForumThread.last_reply_at.desc().nullslast(), ForumThread.created_at.desc())
        )
        threads = q.offset((page - 1) * per_page).limit(per_page).all()
        return threads
    finally:
        session.close()


@router.post("/categories/{category_slug}/threads", response_model=ThreadOut)
def create_thread(
    category_slug: str,
    data: ThreadCreate,
    current_user: CommunityUser = Depends(require_socio),
):
    session = get_session()
    try:
        cat = session.query(ForumCategory).filter(ForumCategory.slug == category_slug).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Categoria non trovata")
        if cat.locked if hasattr(cat, "locked") else False:
            raise HTTPException(status_code=403, detail="Categoria bloccata")

        thread = ForumThread(
            category_id=cat.id,
            user_id=current_user.id,
            titolo=data.titolo,
            corpo=data.corpo,
        )
        session.add(thread)
        session.commit()
        session.refresh(thread)
        return thread
    finally:
        session.close()


@router.get("/threads/{thread_id}", response_model=ThreadOut)
def get_thread(
    thread_id: UUID,
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    session = get_session()
    try:
        thread = session.query(ForumThread).filter(ForumThread.id == thread_id).first()
        if not thread:
            raise HTTPException(status_code=404, detail="Thread non trovato")

        cat = session.query(ForumCategory).filter(ForumCategory.id == thread.category_id).first()
        if cat and not cat.pubblica and (not current_user or current_user.ruolo == "guest"):
            raise HTTPException(status_code=403, detail="Accesso riservato ai soci")

        # Incrementa views
        thread.views += 1
        session.commit()
        session.refresh(thread)
        return thread
    finally:
        session.close()


@router.get("/search", response_model=List[ThreadList])
def search_threads(
    q: str = Query(min_length=3),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    """Ricerca full-text sui thread tramite PostgreSQL tsvector."""
    session = get_session()
    try:
        is_socio = current_user and current_user.ruolo in ("socio", "admin")
        base_q = (
            session.query(ForumThread)
            .join(ForumCategory, ForumThread.category_id == ForumCategory.id)
        )
        if not is_socio:
            base_q = base_q.filter(ForumCategory.pubblica == True)

        results = (
            base_q
            .filter(text("search_vector @@ plainto_tsquery('italian', :q)").bindparams(q=q))
            .order_by(text("ts_rank(search_vector, plainto_tsquery('italian', :q)) DESC").bindparams(q=q))
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return results
    finally:
        session.close()


# =============================================================================
# POST
# =============================================================================

@router.get("/threads/{thread_id}/posts", response_model=List[PostOut])
def list_posts(
    thread_id: UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional),
):
    session = get_session()
    try:
        thread = session.query(ForumThread).filter(ForumThread.id == thread_id).first()
        if not thread:
            raise HTTPException(status_code=404, detail="Thread non trovato")

        cat = session.query(ForumCategory).filter(ForumCategory.id == thread.category_id).first()
        if cat and not cat.pubblica and (not current_user or current_user.ruolo == "guest"):
            raise HTTPException(status_code=403, detail="Accesso riservato ai soci")

        posts = (
            session.query(ForumPost)
            .filter(ForumPost.thread_id == thread_id, ForumPost.moderato == False)
            .order_by(ForumPost.created_at)
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return posts
    finally:
        session.close()


@router.post("/threads/{thread_id}/posts", response_model=PostOut)
def create_post(
    thread_id: UUID,
    data: PostCreate,
    current_user: CommunityUser = Depends(require_socio),
):
    session = get_session()
    try:
        thread = session.query(ForumThread).filter(ForumThread.id == thread_id).first()
        if not thread:
            raise HTTPException(status_code=404, detail="Thread non trovato")
        if thread.locked:
            raise HTTPException(status_code=403, detail="Thread chiuso, non è possibile rispondere")

        post = ForumPost(
            thread_id=thread_id,
            user_id=current_user.id,
            corpo=data.corpo,
        )
        session.add(post)

        # Aggiorna contatore e data ultima risposta
        thread.replies_count += 1
        thread.last_reply_at = datetime.now(timezone.utc)

        # Notifica il creatore del thread
        if thread.user_id != current_user.id:
            notif = CommunityNotification(
                user_id=thread.user_id,
                tipo="forum_reply",
                titolo=f"{current_user.nome} ha risposto al tuo thread",
                corpo=thread.titolo[:100],
                link=f"/forum/threads/{thread_id}",
            )
            session.add(notif)

        session.commit()
        session.refresh(post)
        return post
    finally:
        session.close()


@router.post("/posts/{post_id}/like", response_model=MessageResponse)
def toggle_like(
    post_id: UUID,
    current_user: CommunityUser = Depends(require_socio),
):
    session = get_session()
    try:
        post = session.query(ForumPost).filter(ForumPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post non trovato")

        existing = session.query(ForumPostLike).filter(
            ForumPostLike.post_id == post_id,
            ForumPostLike.user_id == current_user.id,
        ).first()

        if existing:
            session.delete(existing)
            post.likes = max(0, post.likes - 1)
            msg = "Like rimosso"
        else:
            like = ForumPostLike(post_id=post_id, user_id=current_user.id)
            session.add(like)
            post.likes += 1
            msg = "Like aggiunto"

        session.commit()
        return MessageResponse(message=msg)
    finally:
        session.close()
