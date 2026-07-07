"""
Router principale del Community Module.
Monta tutti i sub-router e espone gli endpoint di admin/analytics.
"""

from fastapi import APIRouter, Depends

from community_module.auth.community_auth import auth_router, require_admin, get_current_user
from community_module.api.forum import router as forum_router
from community_module.api.chat import router as chat_router
from community_module.api.research import router as research_router
from community_module.api.events import router as events_router
from community_module.api.lavori import router as lavori_router
from community_module.api.media import router as media_router
from community_module.api.canzoniere import router as canzoniere_router
from community_module.api.ricettario import router as ricettario_router
from community_module.integrations.analytics import stats_community, aggrega_risposte_survey, analisi_ai_survey
from community_module.models.community_models import CommunityUser, CommunityNotification, get_session
from community_module.models.schemas import NotificationOut

from uuid import UUID
from typing import List

# Router radice montato su /community nell'app principale
community_router = APIRouter(prefix="/community")

community_router.include_router(auth_router)
community_router.include_router(forum_router)
community_router.include_router(chat_router)
community_router.include_router(research_router)
community_router.include_router(events_router)
community_router.include_router(lavori_router)
community_router.include_router(media_router)
community_router.include_router(canzoniere_router)
community_router.include_router(ricettario_router)


# =============================================================================
# ADMIN DASHBOARD
# =============================================================================

@community_router.get("/admin/stats")
def admin_stats(current_user: CommunityUser = Depends(require_admin)):
    return stats_community()


@community_router.get("/admin/surveys/{survey_id}/aggregate")
def admin_survey_aggregate(
    survey_id: UUID,
    current_user: CommunityUser = Depends(require_admin),
):
    return aggrega_risposte_survey(survey_id)


@community_router.get("/admin/surveys/{survey_id}/ai-analysis")
def admin_survey_ai(
    survey_id: UUID,
    current_user: CommunityUser = Depends(require_admin),
):
    return {"analisi": analisi_ai_survey(survey_id)}


# =============================================================================
# NOTIFICHE UTENTE
# =============================================================================

@community_router.get("/notifications", response_model=List[NotificationOut])
def my_notifications(
    limit: int = 20,
    current_user: CommunityUser = Depends(get_current_user),
):
    session = get_session()
    try:
        return (
            session.query(CommunityNotification)
            .filter(CommunityNotification.user_id == current_user.id)
            .order_by(CommunityNotification.created_at.desc())
            .limit(limit)
            .all()
        )
    finally:
        session.close()


@community_router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: UUID,
    current_user: CommunityUser = Depends(get_current_user),
):
    session = get_session()
    try:
        notif = session.query(CommunityNotification).filter(
            CommunityNotification.id == notification_id,
            CommunityNotification.user_id == current_user.id,
        ).first()
        if notif:
            notif.letta = True
            session.commit()
        return {"success": True}
    finally:
        session.close()


# =============================================================================
# HEALTH CHECK
# =============================================================================

@community_router.get("/health")
def health():
    return {"status": "ok", "module": "community"}
