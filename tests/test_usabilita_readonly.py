import pytest
from fastapi.testclient import TestClient
from community_app import app

client = TestClient(app)

def test_forum_categories_read():
    response = client.get("/community/forum/categories")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_forum_threads_read():
    response = client.get("/community/forum/categories/comunicazioni/threads")
    assert response.status_code in [200, 404]

def test_canzoniere_read():
    response = client.get("/community/canzoniere/brani")
    assert response.status_code == 200
    # May return a list or dict with items. Let's just check status code
    # to be safe for now, as usability is about no 500s.

def test_ricettario_read():
    response = client.get("/community/ricettario/ricette")
    assert response.status_code == 200

def test_catalogo_read():
    response = client.get("/community/catalogo/categorie")
    assert response.status_code in [200, 404]

