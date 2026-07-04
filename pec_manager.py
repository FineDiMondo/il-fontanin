#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PEC Manager - Gestione PEC Aruba con Gemini AI per risposte intelligenti
"""

import os
import imaplib
import smtplib
import time
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.parser import BytesParser
from dotenv import load_dotenv
from datetime import datetime
from google.cloud import secretmanager
import google.generativeai as genai

load_dotenv('.env.local')

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [PEC] %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SecretManager:
    """Gestisce i segreti in GCP Secret Manager"""

    def __init__(self, project_id):
        self.project_id = project_id
        self.client = secretmanager.SecretManagerServiceClient()

    def get_secret(self, secret_name):
        """Recupera un segreto da GCP Secret Manager"""
        try:
            path = f"projects/{self.project_id}/secrets/{secret_name}/versions/latest"
            response = self.client.access_secret_version(request={"name": path})
            return response.payload.data.decode("UTF-8")
        except Exception as e:
            logger.error(f"Errore nel recuperare il segreto '{secret_name}': {e}")
            return None

    def create_secret(self, secret_name, secret_value):
        """Crea un nuovo segreto in GCP Secret Manager"""
        try:
            parent = f"projects/{self.project_id}"
            secret = self.client.create_secret(
                request={
                    "parent": parent,
                    "secret_id": secret_name,
                    "secret": {"replication": {"automatic": {}}}
                }
            )
            logger.info(f"Segreto '{secret_name}' creato in GCP")

            # Aggiungi la versione con il valore
            self.client.add_secret_version(
                request={
                    "parent": secret.name,
                    "payload": {"data": secret_value.encode("UTF-8")}
                }
            )
            return True
        except Exception as e:
            logger.warning(f"Errore nel creare il segreto: {e}")
            return False


class PECManager:
    """Gestisce la casella PEC Aruba con risposte intelligenti"""

    def __init__(self):
        self.pec_email = os.getenv('PEC_EMAIL', 'direttivo@finedimondo.it')
        self.pec_imap_host = os.getenv('PEC_IMAP_HOST', 'imaps.pec.aruba.it')
        self.pec_imap_port = int(os.getenv('PEC_IMAP_PORT', 993))
        self.pec_smtp_host = os.getenv('PEC_SMTP_HOST', 'smtps.pec.aruba.it')
        self.pec_smtp_port = int(os.getenv('PEC_SMTP_PORT', 465))
        self.check_interval = int(os.getenv('PEC_CHECK_INTERVAL', 300))

        self.project_id = os.getenv('GCP_PROJECT_ID', 'freedomrun-491323')
        self.gemini_model = os.getenv('GEMINI_MODEL', 'gemini-1.5-pro')

        # Inizializza Secret Manager
        self.secrets = SecretManager(self.project_id)

        # Credenziali (da leggere da Secret Manager)
        self.pec_password = None

        logger.info(f"PEC Manager inizializzato per: {self.pec_email}")

    def load_credentials(self):
        """Carica le credenziali da GCP Secret Manager"""
        logger.info("[LOAD] Caricamento credenziali PEC da GCP Secret Manager...")

        self.pec_password = self.secrets.get_secret('pec-password')

        if not self.pec_password:
            logger.warning("ATTENZIONE: password PEC non trovata in Secret Manager")
            logger.info("Per impostare la password, eseguire:")
            logger.info(f"  gcloud secrets create pec-password --data-file=-")
            logger.info(f"  (incolla la password e premi Ctrl+D)")
            return False

        logger.info("[OK] Credenziali caricate")
        return True

    def connect_imap(self):
        """Connette alla casella PEC via IMAP SSL"""
        try:
            logger.info(f"[IMAP] Connessione a {self.pec_imap_host}:{self.pec_imap_port}")

            imap = imaplib.IMAP4_SSL(self.pec_imap_host, self.pec_imap_port)
            imap.login(self.pec_email, self.pec_password)

            logger.info("[OK] Connessione IMAP stabilita")
            return imap
        except Exception as e:
            logger.error(f"[ERROR] Connessione IMAP fallita: {e}")
            return None

    def fetch_unread(self, imap):
        """Legge le email non lette dalla casella PEC"""
        try:
            logger.info("[FETCH] Ricerca email non lette...")

            # Seleziona INBOX
            imap.select('INBOX')

            # Cerca email non lette
            status, msg_ids = imap.search(None, 'UNSEEN')

            if status != 'OK':
                logger.warning("Nessuna email non letta")
                return []

            msg_ids = msg_ids[0].split()
            logger.info(f"[OK] Trovate {len(msg_ids)} email non lette")

            emails = []
            for msg_id in msg_ids[:5]:  # Processa max 5 email per volta
                try:
                    status, msg_data = imap.fetch(msg_id, '(RFC822)')
                    msg = BytesParser().parsebytes(msg_data[0][1])

                    emails.append({
                        'msg_id': msg_id,
                        'from': msg['from'],
                        'subject': msg['subject'],
                        'body': self._extract_body(msg),
                        'date': msg['date']
                    })
                except Exception as e:
                    logger.warning(f"Errore nel parsing email {msg_id}: {e}")

            return emails

        except Exception as e:
            logger.error(f"[ERROR] Errore nel fetch delle email: {e}")
            return []

    def _extract_body(self, msg):
        """Estrae il corpo del testo da un messaggio email"""
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body += part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        return body.strip()

    def generate_reply(self, email_data):
        """Genera una risposta intelligente con Gemini AI"""
        try:
            logger.info(f"[GEMINI] Generazione risposta per: {email_data['from']}")

            # Configura Gemini
            genai.configure(api_key=os.getenv('GOOGLE_API_KEY', ''))

            prompt = f"""
Tu sei l'assistente IA dell'associazione Fine di Mondo APS.
Hai ricevuto la seguente email certificata (PEC):

DA: {email_data['from']}
OGGETTO: {email_data['subject']}
DATA: {email_data['date']}

CONTENUTO:
{email_data['body']}

Genera una risposta professionale, breve (max 200 parole) che:
1. Ringrazzia per la comunicazione
2. Conferma ricezione della PEC
3. Indirizza appropriatamente (es. "Ti contatteremo entro 2 giorni")
4. È firmata come: "Fine di Mondo APS - Ufficio Amministrativo"

Genera SOLO il testo della risposta, senza marcatori speciali.
"""

            model = genai.GenerativeModel(self.gemini_model)
            response = model.generate_content(prompt)

            reply_text = response.text.strip()
            logger.info(f"[OK] Risposta generata ({len(reply_text)} caratteri)")

            return reply_text

        except Exception as e:
            logger.warning(f"[WARN] Errore generazione risposta: {e}")
            return self._default_reply()

    def _default_reply(self):
        """Risposta di fallback se Gemini non disponibile"""
        return """Grazie per la Vostra comunicazione.
Abbiamo ricevuto la presente comunicazione certificata.
Vi contatteremo entro 2 giorni lavorativi.

Fine di Mondo APS - Ufficio Amministrativo"""

    def send_reply(self, imap, email_data, reply_text):
        """Invia la risposta via SMTP PEC"""
        try:
            logger.info(f"[SMTP] Invio risposta a {email_data['from']}")

            # Crea il messaggio
            msg = MIMEMultipart()
            msg['From'] = self.pec_email
            msg['To'] = email_data['from']
            msg['Subject'] = f"Re: {email_data['subject']}"

            msg.attach(MIMEText(reply_text, 'plain', 'utf-8'))

            # Connette SMTP e invia
            smtp = smtplib.SMTP_SSL(self.pec_smtp_host, self.pec_smtp_port)
            smtp.login(self.pec_email, self.pec_password)
            smtp.send_message(msg)
            smtp.quit()

            # Marca come letta
            imap.store(email_data['msg_id'], '+FLAGS', '\\Seen')

            logger.info(f"[OK] Risposta inviata a {email_data['from']}")
            return True

        except Exception as e:
            logger.error(f"[ERROR] Errore invio risposta: {e}")
            return False

    def process_emails(self):
        """Processa tutte le email non lette"""
        if not self.load_credentials():
            logger.error("Impossibile caricare le credenziali")
            return False

        imap = self.connect_imap()
        if not imap:
            return False

        try:
            emails = self.fetch_unread(imap)

            for email_data in emails:
                logger.info(f"\n{'='*60}")
                logger.info(f"Elaborazione email da: {email_data['from']}")
                logger.info(f"Oggetto: {email_data['subject']}")
                logger.info(f"{'='*60}\n")

                reply_text = self.generate_reply(email_data)
                self.send_reply(imap, email_data, reply_text)

                logger.info("")

            return True

        finally:
            imap.close()
            imap.logout()

    def start_monitoring(self):
        """Avvia il monitoraggio continuo della casella PEC"""
        logger.info(f"\n{'='*60}")
        logger.info(f"PEC Manager avviato - Intervallo check: {self.check_interval}s")
        logger.info(f"{'='*60}\n")

        while True:
            try:
                self.process_emails()
            except KeyboardInterrupt:
                logger.info("\n[STOP] Monitoraggio PEC interrotto")
                break
            except Exception as e:
                logger.error(f"[ERROR] Errore nel ciclo di monitoraggio: {e}")

            logger.info(f"Prossimo check in {self.check_interval} secondi...\n")
            time.sleep(self.check_interval)


def main():
    """Funzione principale"""
    manager = PECManager()

    # Se lanciato con argomento 'setup', crea il segreto interattivamente
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'setup':
        logger.info("[SETUP] Configurazione credenziali PEC...")
        password = input("Inserisci password PEC (sarà salvata in Secret Manager): ")
        if manager.secrets.create_secret('pec-password', password):
            logger.info("[OK] Password salvata in GCP Secret Manager")
        else:
            logger.error("[ERROR] Errore nel salvataggio")
        return

    # Altrimenti avvia il monitoraggio
    manager.start_monitoring()


if __name__ == "__main__":
    main()
