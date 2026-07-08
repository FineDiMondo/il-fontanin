"""
Aggiorna i metadata_schema delle categorie ESISTENTI del Catalogo Territoriale.

create_catalogo_tables.py salta le categorie gia' presenti, quindi non aggiorna
mai un DB gia' seedato: questo script fa l'UPDATE. Idempotente, ri-eseguibile.
Fonte unica degli schemi: community_module/catalogo_schemas_seed.py (AF-ADD-02 §2.3).

Uso:  python update_catalogo_schemas.py --env local --yes [--dry-run]
NB (AGENTS.md R3): l'esecuzione contro il DB di produzione e' un deploy —
richiede autorizzazione esplicita di Daniel nella sessione.
"""
import sys
import os
import argparse
import dotenv

parser = argparse.ArgumentParser(description="Update metadata_schema of existing catalog categories.")
parser.add_argument("--yes", action="store_true", help="Confirm execution")
parser.add_argument("--env", type=str, choices=["local", "staging"], required=True, help="Environment to target")
parser.add_argument("--dry-run", action="store_true", help="Show what would change without writing")
args = parser.parse_args()

if not args.yes:
    print("Error: --yes flag is required to run this script.")
    sys.exit(1)

if args.env == "local":
    dotenv.load_dotenv(".env.local")
elif args.env == "staging":
    dotenv.load_dotenv(".env.staging")

print(f"Targeting {args.env} environment. DB_HOST={os.getenv('JACKASS_DB_HOST', 'default')}")

from community_module.models.community_models import CatalogoCategoria, get_session
from community_module.catalogo_schemas_seed import CATEGORIE_SCHEMAS

session = get_session()
try:
    aggiornate, mancanti, invariate = [], [], []
    for codice, schema in CATEGORIE_SCHEMAS.items():
        cat = session.query(CatalogoCategoria).filter_by(codice=codice).first()
        if not cat:
            mancanti.append(codice)
            continue
        if cat.metadata_schema == schema:
            invariate.append(codice)
            continue
        if not args.dry_run:
            cat.metadata_schema = schema
        aggiornate.append(codice)

    if args.dry_run:
        print(f"[DRY-RUN] Da aggiornare: {aggiornate or 'nessuna'}")
    else:
        session.commit()
        print(f"Aggiornate: {aggiornate or 'nessuna'}")
    print(f"Invariate (gia' allineate): {invariate or 'nessuna'}")
    if mancanti:
        print(f"ATTENZIONE — categorie non trovate nel DB (eseguire prima create_catalogo_tables.py): {mancanti}")
        sys.exit(2)
finally:
    session.close()
print("Done.")
