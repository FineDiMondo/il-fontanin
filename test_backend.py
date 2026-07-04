import unittest
import os
import sys

# Aggiunge il percorso corrente a sys.path per importare l'applicazione FastAPI
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from community_app import app

class TestCommunityBackend(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Inizializza il client di test per l'applicazione FastAPI
        cls.client = TestClient(app)
        print("\n--- INIZIO SUITE TEST TECNICI BACKEND ---")

    def test_01_health_check(self):
        """Verifica che l'endpoint di health check risponda 200 OK ed esibisca il modulo corretto."""
        print("\n[TEST] Esecuzione verifica Health Check...")
        response = self.client.get("/community/health")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("module"), "community")
        print(" -> PASSED: Health check conforme.")

    def test_02_cors_preflight(self):
        """Verifica che l'endpoint di login gestisca correttamente la richiesta CORS preflight (OPTIONS)."""
        print("\n[TEST] Esecuzione verifica CORS Preflight headers...")
        headers = {
            "Origin": "https://el-fontanin.web.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        }
        response = self.client.options("/community/auth/google-login", headers=headers)
        
        # Le richieste OPTIONS per CORS preflight devono restituire 200 o 204
        self.assertIn(response.status_code, [200, 204])
        self.assertEqual(response.headers.get("access-control-allow-origin"), "https://el-fontanin.web.app")
        self.assertEqual(response.headers.get("access-control-allow-credentials"), "true")
        print(" -> PASSED: CORS preflight corretto (non-wildcard con credenziali).")

    def test_03_login_unauthorized_token(self):
        """Verifica che l'invio di un token Firebase vuoto o non valido risponda con 401 Unauthorized."""
        print("\n[TEST] Esecuzione verifica comportamento con token non valido...")
        payload = {"id_token": "token_non_valido_di_prova_qa"}
        response = self.client.post("/community/auth/google-login", json=payload)
        
        # Deve restituire 401 a causa della firma del token non valida
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("detail", data)
        self.assertTrue(data["detail"].startswith("Token Google non valido"))
        print(" -> PASSED: Intercettazione token non valido eseguita (HTTP 401).")

    @classmethod
    def tearDownClass(cls):
        print("\n--- SUITE TEST TECNICI BACKEND COMPLETATA ---")

if __name__ == "__main__":
    unittest.main()
