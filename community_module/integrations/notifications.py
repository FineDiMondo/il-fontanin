"""
Notifiche ai soci via PEC e WhatsApp.
Riutilizza pec_manager.py e whatsapp_manager.py già presenti in FreedomRun.
"""

import os
import sys
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Aggiungi la root di FreedomRun al path per importare i moduli esistenti
_freedomrun_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if _freedomrun_root not in sys.path:
    sys.path.insert(0, _freedomrun_root)


def _get_pec_manager():
    try:
        from pec_manager import PECManager
        return PECManager()
    except Exception as e:
        logger.warning(f"PECManager non disponibile: {e}")
        return None


def _get_whatsapp_manager():
    try:
        from whatsapp_manager import WhatsAppManager
        return WhatsAppManager()
    except Exception as e:
        logger.warning(f"WhatsAppManager non disponibile: {e}")
        return None


def invia_notifica_iscrizione_evento(
    email_socio: str,
    nome_socio: str,
    titolo_evento: str,
    data_evento: str,
    luogo: Optional[str] = None,
    stato: str = "confermata",
):
    """Invia conferma iscrizione evento via PEC."""
    pec = _get_pec_manager()
    if not pec:
        logger.warning(f"PEC non disponibile — skip notifica iscrizione per {email_socio}")
        return

    stato_label = "CONFERMATA" if stato == "confermata" else "IN LISTA D'ATTESA"
    corpo = f"""Gentile {nome_socio},

la tua iscrizione all'evento "{titolo_evento}" è {stato_label}.

Data: {data_evento}
{f"Luogo: {luogo}" if luogo else ""}

Conserva questa email come conferma.
Per cancellare l'iscrizione, accedi alla tua area soci su Fine di Mondo Community.

A presto,
Fine di Mondo APS
direttivo@finedimondo.it
"""
    try:
        pec.send_email(
            to=email_socio,
            subject=f"[Fine di Mondo] Iscrizione {stato_label}: {titolo_evento}",
            body=corpo,
        )
        logger.info(f"PEC iscrizione inviata a {email_socio}")
    except Exception as e:
        logger.error(f"Errore invio PEC a {email_socio}: {e}")


def invia_notifica_risposta_forum(
    email_socio: str,
    nome_socio: str,
    titolo_thread: str,
    nome_chi_risponde: str,
    url_thread: str,
):
    """Notifica via WhatsApp quando qualcuno risponde al proprio thread."""
    wa = _get_whatsapp_manager()
    if not wa:
        return

    messaggio = (
        f"👋 Ciao {nome_socio}!\n\n"
        f"*{nome_chi_risponde}* ha risposto al tuo thread nel forum Fine di Mondo:\n"
        f"📌 _{titolo_thread}_\n\n"
        f"Leggi la risposta: {url_thread}"
    )
    try:
        wa.send_message(messaggio)
        logger.info(f"WhatsApp forum reply inviato per {nome_socio}")
    except Exception as e:
        logger.error(f"Errore WhatsApp notifica forum: {e}")


def invia_promemoria_evento(
    nome_socio: str,
    titolo_evento: str,
    data_evento: str,
    luogo: Optional[str] = None,
):
    """Promemoria evento il giorno prima via WhatsApp (chiamato da cron)."""
    wa = _get_whatsapp_manager()
    if not wa:
        return

    messaggio = (
        f"⏰ Promemoria Fine di Mondo!\n\n"
        f"Domani c'è: *{titolo_evento}*\n"
        f"📅 {data_evento}\n"
        f"{f'📍 {luogo}' if luogo else ''}\n\n"
        f"Non dimenticare il QR code per il check-in!"
    )
    try:
        wa.send_message(messaggio)
    except Exception as e:
        logger.error(f"Errore WhatsApp promemoria evento: {e}")


def invia_notifica_nuovo_sondaggio(
    nome_socio: str,
    titolo_esperimento: str,
    url_sondaggio: str,
):
    """Notifica ai soci di un nuovo sondaggio/esperimento attivo."""
    wa = _get_whatsapp_manager()
    if not wa:
        return

    messaggio = (
        f"🔬 Nuovo sondaggio Fine di Mondo!\n\n"
        f"*{titolo_esperimento}*\n\n"
        f"La tua partecipazione è importante per il progetto sperimentale dell'associazione.\n"
        f"👉 Compila qui: {url_sondaggio}"
    )
    try:
        wa.send_message(messaggio)
    except Exception as e:
        logger.error(f"Errore WhatsApp notifica sondaggio: {e}")
