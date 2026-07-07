import sys
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from community_module.models.community_models import get_session, CompetenzaDominio
from sqlalchemy.exc import IntegrityError

def bootstrap_dominio():
    session = get_session()
    try:
        esistente = session.query(CompetenzaDominio).filter_by(codice="monumenti-cristiani").first()
        if esistente:
            print("Dominio 'monumenti-cristiani' già esistente.")
            return

        nuovo = CompetenzaDominio(
            codice="monumenti-cristiani",
            nome="Monumenti e Testimonianze Cristiane",
            descrizione="Competenza nella storia, architettura e catalogazione dei monumenti e delle testimonianze cristiane sul territorio.",
            domande_json=[
                {
                    "id": "q1",
                    "testo": "Qual è il tuo livello di istruzione pertinente a questo dominio (es. Laurea in Storia dell'Arte, Architettura, etc.)?",
                    "tipo": "testo"
                },
                {
                    "id": "q2",
                    "testo": "Hai mai pubblicato ricerche, articoli o libri su monumenti storici?",
                    "tipo": "scelta_singola",
                    "opzioni": ["Sì, numerose pubblicazioni", "Sì, alcune", "No"]
                },
                {
                    "id": "q3",
                    "testo": "Fai parte di associazioni o enti che si occupano di tutela del patrimonio storico?",
                    "tipo": "testo"
                }
            ],
            attivo=True
        )
        session.add(nuovo)
        session.commit()
        print("Dominio 'monumenti-cristiani' creato con successo.")
    except Exception as e:
        session.rollback()
        print(f"Errore: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    bootstrap_dominio()
