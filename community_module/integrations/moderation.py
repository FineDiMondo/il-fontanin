"""
Moderazione automatica dei contenuti con Gemini AI.
Riutilizza il pattern già presente in gemini_jackass_ai.py.
"""

import os
import logging
from typing import Optional

try:
    import google.generativeai as genai
    _gemini_available = True
except ImportError:
    _gemini_available = False

logger = logging.getLogger(__name__)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", "")

_gemini_client = None


def _get_client():
    global _gemini_client
    if _gemini_client is None and _gemini_available and GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_client = genai.GenerativeModel(GEMINI_MODEL)
    return _gemini_client


MODERATION_PROMPT = """Sei un moderatore per una community dell'associazione culturale "Fine di Mondo APS".
Analizza il seguente testo e rispondi con un JSON:
{{
  "approvato": true/false,
  "motivo": "breve spiegazione se non approvato",
  "punteggio": 0-10  (0=sicuro, 10=offensivo)
}}

Rifiuta testi che contengano: insulti, hate speech, spam, contenuto sessuale esplicito,
violenza gratuita, doxing, pubblicità non autorizzata.

Testo da analizzare:
---
{testo}
---"""


def modera_contenuto(testo: str) -> dict:
    """
    Chiama Gemini per moderare un testo.
    Ritorna {"approvato": bool, "motivo": str, "punteggio": int}.
    Se Gemini non è disponibile, approva di default (fail-open per non bloccare).
    """
    client = _get_client()
    if not client:
        logger.warning("Gemini non disponibile, contenuto approvato di default")
        return {"approvato": True, "motivo": "", "punteggio": 0}

    try:
        prompt = MODERATION_PROMPT.format(testo=testo[:2000])
        response = client.generate_content(prompt)
        text = response.text.strip()

        # Estrai JSON dalla risposta
        import json, re
        match = re.search(r'\{.*?\}', text, re.DOTALL)
        if match:
            result = json.loads(match.group())
            return {
                "approvato": bool(result.get("approvato", True)),
                "motivo": result.get("motivo", ""),
                "punteggio": int(result.get("punteggio", 0)),
            }
    except Exception as e:
        logger.error(f"Errore moderazione Gemini: {e}")

    return {"approvato": True, "motivo": "", "punteggio": 0}


ANALYSIS_PROMPT = """Sei un ricercatore sociale che analizza risposte a un sondaggio.

Domande del sondaggio:
{domande}

Risposte (campione di {n} partecipanti):
{risposte}

Fornisci:
1. Temi principali emersi dalle risposte aperte
2. Pattern ricorrenti
3. Insights rilevanti per un'associazione culturale
4. Eventuali criticità emerse

Sii sintetico e obiettivo. Risposta in italiano."""


def analizza_risposte_sondaggio(domande: list, risposte: list) -> str:
    """
    Analisi qualitativa delle risposte aperte di un sondaggio con Gemini AI.
    Ritorna un testo di analisi.
    """
    client = _get_client()
    if not client:
        return "Analisi AI non disponibile (Gemini non configurato)."

    try:
        import json
        domande_txt = "\n".join([f"- {d.get('testo', '')}" for d in domande if d.get('tipo') == 'testo'])
        risposte_sample = risposte[:50]  # Max 50 risposte per prompt
        risposte_txt = json.dumps(risposte_sample, ensure_ascii=False, indent=2)

        prompt = ANALYSIS_PROMPT.format(
            domande=domande_txt,
            n=len(risposte_sample),
            risposte=risposte_txt[:8000],
        )
        response = client.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Errore analisi Gemini: {e}")
        return f"Errore durante l'analisi AI: {e}"
