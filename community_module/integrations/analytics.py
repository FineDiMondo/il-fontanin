"""
Analytics e export dati per la ricerca sociale.
Fornisce aggregazioni statistiche e integrazione con analisi AI.
"""

import logging
from uuid import UUID
from typing import List, Dict, Any, Optional
from collections import Counter

from community_module.models.community_models import (
    get_session, ResearchSurvey, ResearchResponse, ResearchExperiment,
    CommunityEvent, EventRegistration, EventCheckin,
    ForumThread, ForumPost, CommunityUser
)
from community_module.integrations.moderation import analizza_risposte_sondaggio

logger = logging.getLogger(__name__)


def aggrega_risposte_survey(survey_id: UUID) -> Dict[str, Any]:
    """
    Aggrega statisticamente le risposte di un sondaggio per domanda.
    Per domande a scelta: conteggi e percentuali.
    Per domande a testo: lista risposte + analisi AI.
    """
    session = get_session()
    try:
        survey = session.query(ResearchSurvey).filter(ResearchSurvey.id == survey_id).first()
        if not survey:
            return {}

        responses = session.query(ResearchResponse).filter(
            ResearchResponse.survey_id == survey_id
        ).all()

        if not responses:
            return {"survey_id": str(survey_id), "totale": 0, "domande": []}

        domande = survey.domande_json
        risultati = []

        for d in domande:
            qid = d["id"]
            tipo = d.get("tipo", "testo")
            risposte_domanda = [r.risposte_json.get(qid) for r in responses if qid in r.risposte_json]

            if tipo in ("scelta_singola", "scelta_multipla"):
                if tipo == "scelta_multipla":
                    flat = []
                    for r in risposte_domanda:
                        if isinstance(r, list):
                            flat.extend(r)
                        elif r:
                            flat.append(r)
                    conteggi = Counter(flat)
                else:
                    conteggi = Counter(str(r) for r in risposte_domanda if r is not None)

                totale_r = sum(conteggi.values()) or 1
                distribuzione = {
                    k: {"count": v, "percentuale": round(v / totale_r * 100, 1)}
                    for k, v in conteggi.most_common()
                }
                risultati.append({
                    "domanda_id": qid,
                    "testo": d.get("testo"),
                    "tipo": tipo,
                    "risposte_totali": len(risposte_domanda),
                    "distribuzione": distribuzione,
                })

            elif tipo == "scala":
                valori = [int(r) for r in risposte_domanda if r is not None]
                if valori:
                    media = round(sum(valori) / len(valori), 2)
                    distribuzione = Counter(str(v) for v in valori)
                else:
                    media = None
                    distribuzione = {}
                risultati.append({
                    "domanda_id": qid,
                    "testo": d.get("testo"),
                    "tipo": tipo,
                    "risposte_totali": len(valori),
                    "media": media,
                    "distribuzione": dict(distribuzione),
                })

            else:  # testo libero
                testi = [str(r) for r in risposte_domanda if r]
                risultati.append({
                    "domanda_id": qid,
                    "testo": d.get("testo"),
                    "tipo": tipo,
                    "risposte_totali": len(testi),
                    "risposte": testi[:20],  # Max 20 nel report, il resto nell'export
                })

        return {
            "survey_id": str(survey_id),
            "titolo": survey.titolo,
            "totale_risposte": len(responses),
            "domande": risultati,
        }
    finally:
        session.close()


def analisi_ai_survey(survey_id: UUID) -> str:
    """Analisi qualitativa delle risposte aperte tramite Gemini."""
    session = get_session()
    try:
        survey = session.query(ResearchSurvey).filter(ResearchSurvey.id == survey_id).first()
        if not survey:
            return "Sondaggio non trovato."

        responses = session.query(ResearchResponse).filter(
            ResearchResponse.survey_id == survey_id
        ).all()

        risposte_aperte = []
        for r in responses:
            subset = {}
            for d in survey.domande_json:
                if d.get("tipo") == "testo" and d["id"] in r.risposte_json:
                    subset[d["testo"]] = r.risposte_json[d["id"]]
            if subset:
                risposte_aperte.append(subset)

        return analizza_risposte_sondaggio(survey.domande_json, risposte_aperte)
    finally:
        session.close()


def stats_community() -> Dict[str, Any]:
    """Statistiche generali della community per la dashboard admin."""
    session = get_session()
    try:
        utenti_totali = session.query(CommunityUser).filter(CommunityUser.attivo == True).count()
        soci = session.query(CommunityUser).filter(CommunityUser.ruolo == "socio").count()
        admin = session.query(CommunityUser).filter(CommunityUser.ruolo == "admin").count()
        thread_totali = session.query(ForumThread).count()
        post_totali = session.query(ForumPost).count()
        eventi_futuri = session.query(CommunityEvent).filter(CommunityEvent.stato == "pubblicato").count()
        esperimenti_attivi = session.query(ResearchExperiment).filter(
            ResearchExperiment.stato == "attivo"
        ).count()

        return {
            "utenti": {"totali": utenti_totali, "soci": soci, "admin": admin},
            "forum": {"thread": thread_totali, "post": post_totali},
            "eventi": {"futuri": eventi_futuri},
            "ricerca": {"esperimenti_attivi": esperimenti_attivi},
        }
    finally:
        session.close()
