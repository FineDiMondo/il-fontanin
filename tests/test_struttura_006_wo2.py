import pytest
from fastapi.testclient import TestClient
from community_module.community_main import community_router
from fastapi import FastAPI

app = FastAPI()
app.include_router(community_router)
client = TestClient(app)

def test_anti_ambiguita():
    # 2 filtri insieme -> 400
    res = client.get("/community/schede?regno_codice=vanaheim&categoria_codice=naturale")
    assert res.status_code == 400
    assert "Fornire solo uno" in res.json()["detail"]

def test_get_regni():
    res = client.get("/community/struttura/regni")
    assert res.status_code == 200
    regni = res.json()
    assert len(regni) >= 9 # dal seed
