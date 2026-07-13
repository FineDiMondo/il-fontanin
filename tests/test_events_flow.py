import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from fastapi import FastAPI
from community_module.community_main import community_router

from community_module.auth.community_auth import get_current_user_optional

app = FastAPI()
app.include_router(community_router)
client = TestClient(app)

class MockUser:
    def __init__(self, id, ruolo):
        self.id = id
        self.ruolo = ruolo

class MockEvent:
    def __init__(self, id, creato_da, stato="bozza", pubblico=True):
        self.id = id
        self.creato_da = creato_da
        self.stato = stato
        self.pubblico = pubblico
        self.titolo = "Test Event"
        self.descrizione = "Desc"
        self.luogo = "Qui"
        self.luogo_online = None
        from datetime import datetime, timezone
        self.starts_at = datetime.now(timezone.utc)
        self.ends_at = datetime.now(timezone.utc)
        self.max_partecipanti = 10
        self.created_at = datetime.now(timezone.utc)
        self.schede_catalogo = []

def test_get_event_bozza_guest():
    author_id = uuid4()
    event_id = uuid4()
    mock_ev = MockEvent(id=event_id, creato_da=author_id, stato="bozza")

    mock_session = MagicMock()
    mock_session.query().filter().first.return_value = mock_ev
    mock_session.query().filter().count.return_value = 0

    app.dependency_overrides[get_current_user_optional] = lambda: None

    with patch('community_module.api.events.get_session', return_value=mock_session):
        response = client.get(f"/community/events/{event_id}")
    
    assert response.status_code == 403
    assert "Evento in bozza" in response.json()["detail"]

def test_get_event_bozza_author():
    author_id = uuid4()
    event_id = uuid4()
    mock_ev = MockEvent(id=event_id, creato_da=author_id, stato="bozza")

    mock_session = MagicMock()
    mock_session.query().filter().first.return_value = mock_ev
    mock_session.query().filter().count.return_value = 0

    app.dependency_overrides[get_current_user_optional] = lambda: MockUser(author_id, "socio")

    with patch('community_module.api.events.get_session', return_value=mock_session):
        response = client.get(f"/community/events/{event_id}")
    
    assert response.status_code == 200
    assert response.json()["id"] == str(event_id)

def test_get_event_bozza_admin():
    author_id = uuid4()
    admin_id = uuid4()
    event_id = uuid4()
    mock_ev = MockEvent(id=event_id, creato_da=author_id, stato="bozza")

    mock_session = MagicMock()
    mock_session.query().filter().first.return_value = mock_ev
    mock_session.query().filter().count.return_value = 0

    app.dependency_overrides[get_current_user_optional] = lambda: MockUser(admin_id, "admin")

    with patch('community_module.api.events.get_session', return_value=mock_session):
        response = client.get(f"/community/events/{event_id}")
    
    assert response.status_code == 200

def test_get_event_pubblicato_guest():
    author_id = uuid4()
    event_id = uuid4()
    mock_ev = MockEvent(id=event_id, creato_da=author_id, stato="pubblicato")

    mock_session = MagicMock()
    mock_session.query().filter().first.return_value = mock_ev
    mock_session.query().filter().count.return_value = 0

    app.dependency_overrides[get_current_user_optional] = lambda: None

    with patch('community_module.api.events.get_session', return_value=mock_session):
        response = client.get(f"/community/events/{event_id}")
    
    assert response.status_code == 200
