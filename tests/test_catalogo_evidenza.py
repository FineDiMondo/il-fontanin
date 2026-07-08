"""
Test AT-CATALOGAZIONE-001-ADD-02: livelli di certezza C/D/I/L.
Copre i casi D1a-D1e di docs/TEST_PLAN_RIALLINEAMENTO_E_ADD-02.md.

A differenza di test_catalogo_security.py, questi test NON toccano il DB:
usano dependency_overrides + mock, cosi' girano ovunque (CI inclusa) senza
scrivere righe in produzione quando eseguiti in locale.
"""
import sys
import os
from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi.testclient import TestClient

from community_app import app
from community_module.api import catalogo as catalogo_api
from community_module.auth.community_auth import get_current_user

client = TestClient(app)

FAKE_USER = SimpleNamespace(id=uuid4(), ruolo="socio", email="validatore@test.local")


def _fake_scheda(evidenza_livello=None, evidenza_fonte=None, stato="bozza"):
    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        id=uuid4(),
        categoria_id=uuid4(),
        sottocategoria_id=None,
        nome="Scheda di test",
        lat=Decimal("45.316000"),
        lng=Decimal("10.933000"),
        descrizione=None,
        cronologia_storica=None,
        evidenza_livello=evidenza_livello,
        evidenza_fonte=evidenza_fonte,
        evidenza_data_verifica=None,
        metadata_specifici=None,
        stato=stato,
        scheda_precedente_id=None,
        creato_da=uuid4(),
        validato_da=None,
        validato_at=None,
        nota_validazione=None,
        created_at=now,
        updated_at=now,
        categoria=SimpleNamespace(
            id=uuid4(), codice="idrico", nome="Idrico",
            metadata_schema={"campi": []}, attivo=True, sottocategorie=[],
        ),
        media=[],
    )


@pytest.fixture
def valida_context(monkeypatch):
    """Prepara app con utente finto, validatore ovunque, sessione DB mock."""
    scheda_holder = {}

    mock_session = MagicMock()
    mock_session.query.return_value.filter_by.return_value.first.side_effect = (
        lambda: scheda_holder.get("scheda")
    )

    def override_session():
        yield mock_session

    monkeypatch.setattr(catalogo_api, "is_validatore_per_dominio", lambda *a, **k: True)
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    app.dependency_overrides[catalogo_api.get_db_session] = override_session
    yield scheda_holder
    app.dependency_overrides.clear()


def _valida(scheda_id, approvata=True, nota=None):
    return client.post(
        f"/community/catalogo/schede/{scheda_id}/valida",
        json={"approvata": approvata, "nota_validazione": nota},
        headers={"Authorization": "Bearer non-usato-per-via-dell-override"},
    )


# --- D1a: approvazione senza livello → 422 (regressione, logica preesistente) ---
def test_approvazione_senza_livello_422(valida_context):
    valida_context["scheda"] = _fake_scheda(evidenza_livello=None)
    r = _valida(valida_context["scheda"].id)
    assert r.status_code == 422
    assert "evidenza_livello" in r.json()["detail"]


# --- D1b: livello C senza fonte → 422 (nuova regola ADD-02) ---
@pytest.mark.parametrize("livello", ["C", "D"])
@pytest.mark.parametrize("fonte", [None, "", "   "])
def test_approvazione_c_d_senza_fonte_422(valida_context, livello, fonte):
    valida_context["scheda"] = _fake_scheda(evidenza_livello=livello, evidenza_fonte=fonte)
    r = _valida(valida_context["scheda"].id)
    assert r.status_code == 422
    assert "evidenza_fonte" in r.json()["detail"]


# --- D1c: livello C con fonte → 200 pubblicato ---
def test_approvazione_c_con_fonte_pubblica(valida_context):
    valida_context["scheda"] = _fake_scheda(
        evidenza_livello="C", evidenza_fonte="Archivio Diocesano Verona, reg. 1742"
    )
    r = _valida(valida_context["scheda"].id)
    assert r.status_code == 200
    assert r.json()["stato"] == "pubblicato"


# --- D1d: livelli I e L senza fonte → 200 (fonte non richiesta) ---
@pytest.mark.parametrize("livello", ["I", "L"])
def test_approvazione_i_l_senza_fonte_pubblica(valida_context, livello):
    valida_context["scheda"] = _fake_scheda(evidenza_livello=livello, evidenza_fonte=None)
    r = _valida(valida_context["scheda"].id)
    assert r.status_code == 200
    assert r.json()["stato"] == "pubblicato"


# --- D1e: valore fuori scala in create/update → 422 (vincolo Literal Pydantic) ---
def test_livello_fuori_scala_create_422(valida_context):
    r = client.post(
        "/community/catalogo/schede",
        json={
            "categoria_id": str(uuid4()),
            "nome": "Test",
            "lat": 45.3,
            "lng": 10.9,
            "evidenza_livello": "X",
        },
        headers={"Authorization": "Bearer non-usato"},
    )
    assert r.status_code == 422


def test_livello_fuori_scala_update_422(valida_context):
    r = client.patch(
        f"/community/catalogo/schede/{uuid4()}",
        json={"evidenza_livello": "certo"},
        headers={"Authorization": "Bearer non-usato"},
    )
    assert r.status_code == 422
