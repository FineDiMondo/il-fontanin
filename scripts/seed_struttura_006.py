import os
import sys
from uuid import uuid4
from dotenv import load_dotenv

# Aggiungi la root del progetto al path per importare community_module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load env before importing models
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env.local')))

from community_module.models.community_models import (
    get_session,
    StrutturaRegno,
    StrutturaRegnoCategoria,
    CatalogoCategoria,
    CatalogoScheda,
    CommunityUser
)

def seed_data():
    session = get_session()
    try:
        # 1. Regni
        regni_data = [
            {"codice": "asgard", "nome": "Asgard", "descrizione": "Il regno degli Dèi", "ordine": 1, "navigabile": True},
            {"codice": "vanaheim", "nome": "Vanaheim", "descrizione": "Il regno della Natura", "ordine": 2, "navigabile": True},
            {"codice": "alfheim", "nome": "Álfheim", "descrizione": "Il regno della Luce e della Cultura", "ordine": 3, "navigabile": True},
            {"codice": "midgard", "nome": "Midgard", "descrizione": "Il regno degli Uomini", "ordine": 4, "navigabile": True},
            {"codice": "jotunheim", "nome": "Jötunheim", "descrizione": "Il regno dei Giganti", "ordine": 5, "navigabile": True},
            {"codice": "svartalfheim", "nome": "Svartálfheim", "descrizione": "Il regno dei Nani e del Lavoro", "ordine": 6, "navigabile": True},
            {"codice": "niflheim", "nome": "Niflheim", "descrizione": "Il regno del Ghiaccio e dell'Acqua", "ordine": 7, "navigabile": True},
            {"codice": "muspelheim", "nome": "Muspelheim", "descrizione": "Il regno del Fuoco", "ordine": 8, "navigabile": True},
            {"codice": "helheim", "nome": "Helheim", "descrizione": "Il regno dei Morti e della Memoria", "ordine": 9, "navigabile": True},
        ]
        
        for r_data in regni_data:
            regno = session.query(StrutturaRegno).filter_by(codice=r_data["codice"]).first()
            if not regno:
                regno = StrutturaRegno(**r_data)
                session.add(regno)

        session.commit()
        
        # 2. Categorie
        categorie_mapping = {
            "vanaheim": ["naturale"],
            "niflheim": ["idrico"],
            "helheim": ["storico", "militare"],
            "asgard": ["monumenti-cristiani"],
            "alfheim": ["culturale"],
            "svartalfheim": ["economico"]
        }
        
        for regno_codice, cat_slugs in categorie_mapping.items():
            for i, codice in enumerate(cat_slugs):
                cat = session.query(CatalogoCategoria).filter_by(codice=codice).first()
                if cat:
                    rc = session.query(StrutturaRegnoCategoria).filter_by(
                        regno_codice=regno_codice, categoria_id=cat.id
                    ).first()
                    if not rc:
                        rc = StrutturaRegnoCategoria(regno_codice=regno_codice, categoria_id=cat.id, ordine=i)
                        session.add(rc)
                        
        session.commit()
        
        # 3. Segnaposto in Asgard
        cat_mc = session.query(CatalogoCategoria).filter_by(codice="monumenti-cristiani").first()
        admin = session.query(CommunityUser).filter_by(ruolo="admin").first()
        
        if cat_mc and admin:
            sp = session.query(CatalogoScheda).filter_by(is_segnaposto=True).first()
            if not sp:
                # Coordinate Sant'Andrea (nodo zero)
                sp = CatalogoScheda(
                    nome="Eventi storici — luogo non ancora catalogato",
                    descrizione="Scheda segnaposto per migrazione eventi legacy, sostituire con scheda reale se identificata",
                    categoria_id=cat_mc.id,
                    stato="pubblicato",
                    creato_da=admin.id,
                    validato_da=admin.id,
                    lat=45.35, # coord dummy
                    lng=10.85, # coord dummy
                    is_segnaposto=True
                )
                session.add(sp)
                session.commit()

        # 4. Seed minimo in Vanaheim e Helheim
        cat_nat = session.query(CatalogoCategoria).filter_by(codice="naturale").first()
        if cat_nat and admin:
            existing = session.query(CatalogoScheda).filter_by(categoria_id=cat_nat.id).first()
            if not existing:
                scheda1 = CatalogoScheda(
                    nome="Albero Monumentale", descrizione="Esempio albero", categoria_id=cat_nat.id,
                    stato="pubblicato", creato_da=admin.id, validato_da=admin.id, lat=45.351, lng=10.851,
                    metadata_specifici={"tipo_elemento": "albero_monumentale"}
                )
                session.add(scheda1)

        cat_sto = session.query(CatalogoCategoria).filter_by(codice="storico").first()
        if cat_sto and admin:
            existing = session.query(CatalogoScheda).filter_by(categoria_id=cat_sto.id).first()
            if not existing:
                scheda2 = CatalogoScheda(
                    nome="Obelisco di Villafranca", descrizione="Obelisco commemorativo", categoria_id=cat_sto.id,
                    stato="pubblicato", creato_da=admin.id, validato_da=admin.id, lat=45.352, lng=10.852
                )
                session.add(scheda2)

        session.commit()
        print("Seed completato con successo.")

    finally:
        session.close()

if __name__ == "__main__":
    seed_data()
