import os
from sqlalchemy import create_engine
from community_module.models.community_models import Base, CatalogoCategoria, get_session, get_engine
import dotenv

dotenv.load_dotenv(".env.local")

engine = get_engine()

print("Creating tables...")
Base.metadata.create_all(engine)
print("Tables created.")

print("Seeding categories...")
session = get_session()

SEED_CATEGORIE = [
    {"codice": "monumenti-cristiani", "nome": "Monumenti Cristiani", "schema": {"campi": [
        {"chiave": "dedicazione", "tipo": "testo", "obbligatorio": False},
        {"chiave": "stato_conservazione", "tipo": "scelta", "opzioni": ["buono","discreto","degradato"], "obbligatorio": True}
    ]}},
    {"codice": "idrico", "nome": "Idrico", "schema": {"campi": []}},
    {"codice": "naturale", "nome": "Naturale", "schema": {"campi": []}},
    {"codice": "storico", "nome": "Storico", "schema": {"campi": []}},
    {"codice": "culturale", "nome": "Culturale", "schema": {"campi": []}},
    {"codice": "economico", "nome": "Economico", "schema": {"campi": []}},
    {"codice": "militare", "nome": "Militare", "schema": {"campi": []}},
]

for cat_data in SEED_CATEGORIE:
    cat = session.query(CatalogoCategoria).filter_by(codice=cat_data["codice"]).first()
    if not cat:
        cat = CatalogoCategoria(
            codice=cat_data["codice"],
            nome=cat_data["nome"],
            metadata_schema=cat_data["schema"]
        )
        session.add(cat)
        print(f"Added category {cat_data['nome']}")
    else:
        print(f"Category {cat_data['nome']} already exists.")

session.commit()
session.close()
print("Seed completed.")
