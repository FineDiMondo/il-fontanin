from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from community_module.models.community_models import StrutturaRegno, get_session
from community_module.models.schemas import StrutturaRegnoOut

router = APIRouter(prefix="/struttura", tags=["struttura"])

def get_db_session():
    session = get_session()
    try:
        yield session
    finally:
        session.close()

@router.get("/regni", response_model=List[StrutturaRegnoOut])
def get_regni(session: Session = Depends(get_db_session)):
    # Restituisce tutti i regni con le loro categorie (via property o relation)
    # Poiché la query è semplice, SQLAlchemy mapperà la relazione "categorie" se configurata
    # nel modello. Vediamo se StrutturaRegno ha una relation 'categorie'
    
    # Nota: su StrutturaRegno c'è il mapping a categorie?
    # Se non c'è una relationship definita in community_models.py, 
    # la possiamo aggiungere o ricostruire qui
    regni = session.query(StrutturaRegno).order_by(StrutturaRegno.ordine).all()
    
    # Ripopoliamo manualmente categorie se necessario, per assicurare l'output
    # o ci affidiamo a schemas se c'è un getter property.
    # Costruiamo il result a mano per sicurezza:
    result = []
    for r in regni:
        # Trova categorie associate via StrutturaRegnoCategoria
        cats = [rc.categoria for rc in sorted(r.categorie, key=lambda x: x.ordine)] if hasattr(r, 'categorie') else []
        r_dict = {
            "codice": r.codice,
            "nome": r.nome,
            "descrizione": r.descrizione,
            "ordine": r.ordine,
            "navigabile": r.navigabile,
            "tema_json": r.tema_json,
            "categorie": cats
        }
        result.append(r_dict)

    return result
