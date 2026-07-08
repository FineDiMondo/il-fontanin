"""
Test di regressione per il fix di sicurezza su GET /community/catalogo/schede.

Sostituisce verify_security_fix.py (rimosso): quello script si limitava a
cercare sottostringhe nel sorgente di catalogo.py (grep travestito da test),
quindi sarebbe passato anche con un bug logico purche' le stringhe giuste
fossero presenti. Questo file esercita davvero l'endpoint via TestClient.

Bug originale: GET /schede?stato=bozza restituiva TUTTE le bozze di TUTTI
gli utenti a chiunque fosse autenticato, senza controllare autore/validatore.
Fix (commit a945aa0): join SQL su CompetenzaDominio/CompetenzaUtente,
autorizzazione a livello di query. Bypass admin preservato.
"""
import sys
import os
from uuid import uuid4

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from community_app import app
from community_module.models.community_models import get_session, CommunityUser
from community_module.auth.community_auth import create_access_token

client = TestClient(app)


def _get_or_create_test_user(email: str, ruolo: str = "socio") -> CommunityUser:
    """Idempotente: riusa l'utente se esiste gia' (evita di sporcare il DB ad ogni run)."""
    session = get_session()
    try:
        user = session.query(CommunityUser).filter(CommunityUser.email == email).first()
        if not user:
            user = CommunityUser(
                id=uuid4(),
                email=email,
                password_hash="!test",
                nome="Test",
                cognome="Security",
                ruolo=ruolo,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        return user
    finally:
        session.close()


def test_get_schede_bozza_senza_auth_e_401():
    response = client.get("/community/catalogo/schede", params={"stato": "bozza"})
    assert response.status_code == 401


def test_get_schede_bozza_utente_non_autore_non_validatore_e_vuoto():
    """Il cuore del fix: un socio qualunque non deve vedere le bozze altrui."""
    user = _get_or_create_test_user("test_nonvalidatore@test.local", ruolo="socio")
    token = create_access_token(str(user.id), user.ruolo)

    response = client.get(
        "/community/catalogo/schede",
        params={"stato": "bozza"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json() == []


def test_get_schede_pubblicato_resta_pubblico():
    """Non regredire sul percorso felice: lo stato pubblicato non richiede auth."""
    response = client.get("/community/catalogo/schede", params={"stato": "pubblicato"})
    assert response.status_code == 200


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
