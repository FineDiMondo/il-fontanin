# ============================================================
# EL FONTANIN — TEST VISITATORE (Progressive Guest Mode)
# File: test_visitatore.py  (accodabile a test_backend.py o standalone)
#
# Esecuzione:
#   pytest test_visitatore.py -v
#   FONTANIN_API_URL=http://localhost:8000 pytest test_visitatore.py -v
#
# Metodo: il perimetro pubblico/protetto NON è ipotizzato ma
# rilevato empiricamente dal backend di produzione (4 lug 2026)
# e qui congelato come contratto. Ogni deriva futura del backend
# rispetto a questo contratto fa fallire la suite in modo
# deterministico.
#
# Contratto rilevato:
#   PUBBLICO  (200 senza token): root, health, forum categories,
#             forum search, events (GET), research experiments (GET)
#   PROTETTO  (401 senza token): auth/me, chat rooms, admin stats,
#             notifications, tutte le scritture (POST)
#   TOKEN NON VALIDO -> 401 pulito, mai 5xx
# ============================================================

import os
import pytest
import requests

BASE_URL = os.environ.get(
    "FONTANIN_API_URL",
    "https://finedimondo-backend-vqytacm7la-ew.a.run.app",
).rstrip("/")

TIMEOUT = 20
AUTH_DETAIL = "Autenticazione richiesta"


@pytest.fixture(scope="session")
def http():
    """Sessione HTTP anonima: rappresenta il Visitatore."""
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    yield s
    s.close()


# ------------------------------------------------------------
# 1. PAGINE INFORMATIVE: accessibili senza credenziali
# ------------------------------------------------------------
PUBLIC_GET = [
    "/",
    "/community/health",
    "/community/forum/categories",
    "/community/forum/search?q=test",
    "/community/events",
    "/community/research/experiments",
]


@pytest.mark.parametrize("path", PUBLIC_GET)
def test_visitatore_accede_a_contenuti_informativi(http, path):
    r = http.get(BASE_URL + path, timeout=TIMEOUT)
    assert r.status_code == 200, f"{path}: atteso 200, ottenuto {r.status_code}"
    # Il payload deve essere JSON valido (il frontend guest lo renderizza)
    r.json()


# ------------------------------------------------------------
# 2. RISORSE PROTETTE (lettura): intercettate con 401
# ------------------------------------------------------------
PROTECTED_GET = [
    "/community/auth/me",
    "/community/chat/rooms",
    "/community/notifications",
    "/community/admin/stats",
]


@pytest.mark.parametrize("path", PROTECTED_GET)
def test_visitatore_bloccato_su_risorse_protette(http, path):
    r = http.get(BASE_URL + path, timeout=TIMEOUT)
    assert r.status_code == 401, f"{path}: atteso 401, ottenuto {r.status_code}"
    assert r.json().get("detail") == AUTH_DETAIL


# ------------------------------------------------------------
# 3. SCRITTURE: nessuna azione di scrittura senza login
# ------------------------------------------------------------
PROTECTED_POST = [
    "/community/events",
    "/community/chat/rooms/generale/messages",
]


@pytest.mark.parametrize("path", PROTECTED_POST)
def test_visitatore_non_puo_scrivere(http, path):
    r = http.post(BASE_URL + path, json={}, timeout=TIMEOUT)
    assert r.status_code == 401, f"POST {path}: atteso 401, ottenuto {r.status_code}"
    assert r.json().get("detail") == AUTH_DETAIL


# ------------------------------------------------------------
# 4. ROBUSTEZZA: token malformato -> rifiuto pulito, mai 5xx
# ------------------------------------------------------------
@pytest.mark.parametrize("token", [
    "FAKE.TOKEN.HERE",
    "",
    "Bearer-senza-struttura",
    "eyJhbGciOiJIUzI1NiJ9.INVALID.SIGNATURE",
])
def test_token_non_valido_rifiutato_senza_errori_server(http, token):
    r = http.get(
        BASE_URL + "/community/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        timeout=TIMEOUT,
    )
    assert r.status_code == 401, f"token '{token[:20]}': atteso 401, ottenuto {r.status_code}"


# ------------------------------------------------------------
# 5. GUARDIA GLOBALE: nessun endpoint del perimetro produce 5xx
#    per un Visitatore (un guest non deve MAI vedere un crash)
# ------------------------------------------------------------
@pytest.mark.parametrize("path", PUBLIC_GET + PROTECTED_GET)
def test_nessun_errore_server_per_il_visitatore(http, path):
    r = http.get(BASE_URL + path, timeout=TIMEOUT)
    assert r.status_code < 500, f"{path}: il Visitatore ha ricevuto {r.status_code}"


# ------------------------------------------------------------
# 6. DISCREPANZA NOTA (documentata, non nascosta):
#    l'OpenAPI dichiara [AUTH] su categories/events/search/research,
#    ma l'implementazione li serve pubblicamente (scelta corretta
#    per il Guest Mode). Finché la spec non viene allineata
#    (security opzionale dichiarata), questo test resta xfail:
#    quando verrà corretta, il test passerà e l'xfail andrà rimosso.
# ------------------------------------------------------------
@pytest.mark.xfail(
    reason="OpenAPI marca come protette rotte servite pubblicamente: "
           "spec da allineare al Progressive Guest Mode",
    strict=False,
)
def test_openapi_coerente_con_perimetro_reale(http):
    spec = http.get(BASE_URL + "/openapi.json", timeout=TIMEOUT).json()
    public_paths = {"/community/forum/categories", "/community/events",
                    "/community/forum/search", "/community/research/experiments"}
    for p in public_paths:
        op = spec["paths"][p]["get"]
        assert not op.get("security"), (
            f"{p} è pubblico in produzione ma marcato con security nella spec"
        )
