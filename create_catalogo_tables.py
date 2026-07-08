import os
import sys
import argparse
from sqlalchemy import create_engine
from community_module.models.community_models import Base, CatalogoCategoria, get_session, get_engine
from community_module.catalogo_schemas_seed import CATEGORIE_SCHEMAS, CATEGORIE_NOMI
import dotenv

parser = argparse.ArgumentParser(description="Create catalog tables and seed categories.")
parser.add_argument("--yes", action="store_true", help="Confirm execution")
parser.add_argument("--env", type=str, choices=["local", "staging"], required=True, help="Environment to target (local or staging)")
args = parser.parse_args()

if not args.yes:
    print("Error: --yes flag is required to run this script.")
    sys.exit(1)

if args.env == "local":
    dotenv.load_dotenv(".env.local")
elif args.env == "staging":
    dotenv.load_dotenv(".env.staging")

print(f"Targeting {args.env} environment. DB_HOST={os.getenv('JACKASS_DB_HOST', 'default')}")

engine = get_engine()

print("Creating tables...")
Base.metadata.create_all(engine)
print("Tables created.")

print("Seeding categories...")
session = get_session()

# Fonte unica degli schemi: community_module/catalogo_schemas_seed.py (AF-ADD-02 §2.3)
SEED_CATEGORIE = [
    {"codice": codice, "nome": CATEGORIE_NOMI[codice], "schema": schema}
    for codice, schema in CATEGORIE_SCHEMAS.items()
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
