import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi.testclient import TestClient
from community_module.community_main import community_router
from fastapi import FastAPI
from unittest.mock import MagicMock
from community_module.api.catalogo import get_db_session as cat_get_db_session
from community_module.api.struttura import get_db_session as str_get_db_session

app = FastAPI()
app.include_router(community_router)
client = TestClient(app)

class MockRegno:
    def __init__(self, codice, nome):
        self.codice = codice
        self.nome = nome
        self.descrizione = "desc"
        self.descrizione_breve = "desc"
        self.descrizione_completa = "desc"
        self.ordine = 1
        self.colore_esadecimale = "#000"
        self.icona = "icon"
        self.is_attivo = True
        self.navigabile = True
        self.tema_json = {}
        self.categorie = []

def mock_get_session():
    session = MagicMock()
    # Mock per far passare get_regni (query(StrutturaRegno).order_by().all())
    session.query.return_value.order_by.return_value.all.return_value = [
        MockRegno(codice="midgard", nome="Midgard") for _ in range(9)
    ]
    yield session

app.dependency_overrides[cat_get_db_session] = mock_get_session
app.dependency_overrides[str_get_db_session] = mock_get_session

def test_anti_ambiguita():
    # 2 filtri insieme -> 400
    res = client.get("/community/catalogo/schede?regno_codice=vanaheim&categoria_codice=naturale")
    assert res.status_code == 400
    assert "Fornire solo uno" in res.json()["detail"]

def test_get_regni():
    res = client.get("/community/struttura/regni")
    assert res.status_code == 200
    regni = res.json()
    assert len(regni) >= 9 # dal seed
