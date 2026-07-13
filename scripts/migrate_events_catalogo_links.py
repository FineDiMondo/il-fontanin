import os
import sys

# Aggiunge la root del progetto al path per importare community_module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from community_module.models.community_models import get_session, CommunityEvent, CatalogoScheda, CommunityEventCatalogoScheda
import argparse

def main():
    parser = argparse.ArgumentParser(description="Migrazione eventi storici verso schede catalogo")
    parser.add_argument("--dry-run", action="store_true", help="Non esegue la commit su db")
    args = parser.parse_args()

    session = get_session()
    try:
        # Cerca scheda segnaposto
        segnaposto = session.query(CatalogoScheda).filter(CatalogoScheda.is_segnaposto == True).first()
        if not segnaposto:
            print("Nessuna scheda segnaposto trovata! (Esegui seed_struttura_006.py prima)")
            return
            
        print(f"Scheda segnaposto trovata: {segnaposto.id} - {segnaposto.nome}")

        eventi = session.query(CommunityEvent).all()
        schede = session.query(CatalogoScheda).filter(CatalogoScheda.is_segnaposto == False).all()

        collegati = 0
        fallback = 0
        gia_collegati = 0

        for ev in eventi:
            # Controllo se ha già un link
            links = session.query(CommunityEventCatalogoScheda).filter(CommunityEventCatalogoScheda.event_id == ev.id).count()
            if links > 0:
                gia_collegati += 1
                continue
                
            # Logica di match basica
            match = None
            if ev.luogo:
                luogo_low = ev.luogo.lower()
                for s in schede:
                    if s.nome.lower() in luogo_low or luogo_low in s.nome.lower():
                        match = s
                        break
            
            target_scheda = match if match else segnaposto
            if match:
                collegati += 1
                print(f"Match trovato per evento '{ev.titolo}' -> Scheda '{match.nome}'")
            else:
                fallback += 1
                print(f"Nessun match per '{ev.titolo}' (luogo: {ev.luogo}) -> Fallback a segnaposto")
                
            if not args.dry_run:
                rel = CommunityEventCatalogoScheda(event_id=ev.id, scheda_id=target_scheda.id)
                session.add(rel)

        if args.dry_run:
            print("\nDRY RUN: nessuna modifica applicata al DB.")
        else:
            session.commit()
            print("\nMigrazione completata con successo.")
            
        print(f"Eventi processati: {len(eventi)}")
        print(f"Già collegati: {gia_collegati}")
        print(f"Match esatti: {collegati}")
        print(f"Fallback a segnaposto: {fallback}")

    finally:
        session.close()

if __name__ == "__main__":
    main()
