#!/usr/bin/env python3
"""
Script per aggiornare il thread 'scalette' a 'argini e scalette' nel database.
Esegui dalla cartella del progetto (D:\Progetti GCloud\fontanin) con le variabili d'ambiente configurate.

Uso:
    cd D:\Progetti GCloud\fontanin
    python update_scalette_thread.py
"""

import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv

# Importa i modelli dal progetto
sys.path.insert(0, os.path.abspath('.'))
from community_module.models.community_models import get_session, ForumThread, ForumCategory

def main():
    import sys
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    load_dotenv(".env.local")
    session = get_session()
    try:
        # Trova il thread con titolo "scaletta" (singolare)
        thread = session.query(ForumThread).filter(
            ForumThread.titolo.ilike('%scaletta%')
        ).first()

        if not thread:
            print("❌ Thread 'scaletta' non trovato nel database.")
            print("   Verifica che esista un thread con quel titolo.")
            return False

        # Categoria
        cat = session.query(ForumCategory).filter(
            ForumCategory.id == thread.category_id
        ).first()

        print(f"✅ Trovato thread: '{thread.titolo}'")
        print(f"   Categoria: {cat.nome if cat else 'N/A'}")
        print(f"   Creato da: {thread.user_id if thread.user else 'N/A'}")
        print()

        # Nuovo titolo e corpo
        thread.titolo = "Argini e scalette"
        thread.corpo = """Nel Fontanin da decenni i frequentatori creano manualmente argini e scalette per migliorare l'accesso al fosso e alle zone d'acqua.

**Come vengono realizzati:**

**Scalette:**
- Due pali (ferro/legno) piantati nella terra, verticali
- Un'asse di legno per il lato esposto verticale del gradino
- Sassi grossi dal letto del fosso come base
- Sassi medi (sempre dal fosso) intermedi
- Ghiaietto dal fosso per riempimento

**Argini:**
- Legni lunghi piantati ai bordi del fosso
- Pali (ferro/legno) nel fondale ai margini
- Tenuta della sponda durante il livello dell'acqua

**Obiettivo attuale:**
Togliere sassi il più possibile vicino alla sorgente per abbassare il fondale e creare una "piscinetta". Lo spostamento dei sassi fa crollare gli argini (molti sono franati), ma abbassa progressivamente il fondo.

**Accelerazione del lavoro:**
Uso di cariole e pale per accelerare rispetto al lavoro manuale tradizionale dei frequentatori del Fontanin."""

        thread.updated_at = datetime.now(timezone.utc)
        session.commit()

        print("✅ Thread aggiornato con successo!")
        print(f"   Nuovo titolo: '{thread.titolo}'")
        print(f"   Corpo: {len(thread.corpo)} caratteri")
        print()
        print("🎉 Pronto per il nuovo tool experimental!")

        return True

    except Exception as e:
        print(f"❌ Errore: {e}")
        session.rollback()
        return False
    finally:
        session.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
