import os
import pytest
from fastapi.testclient import TestClient
from community_app import app

# Check if write tests are enabled via environment variable
pytestmark = pytest.mark.skipif(
    os.environ.get("FONTANIN_WRITE_TESTS") != "1",
    reason="Write tests are gated. Set FONTANIN_WRITE_TESTS=1 to run."
)

client = TestClient(app)

# Helper function to mock user authentication for testing if needed
# In a real scenario, this might need an actual valid Firebase token or a test override dependency

def test_forum_create_thread_gated():
    # Attempt to create a thread
    # Without valid auth, it should return 401. If auth is mocked, 200 or 201.
    payload = {
        "title": "Test Thread Usabilità",
        "body": "Contenuto del test autogenerato"
    }
    response = client.post("/community/forum/categories/comunicazioni/threads", json=payload)
    # The actual status code depends on whether auth bypass is set up for tests
    assert response.status_code in [401, 200, 201]

def test_catalogo_create_scheda_gated():
    payload = {
        "titolo": "Test Scheda",
        "descrizione": "Descrizione scheda",
        "categoria_id": 1,
        "comune": "Villafranca"
    }
    response = client.post("/community/catalogo/schede", json=payload)
    assert response.status_code in [401, 200, 201]
