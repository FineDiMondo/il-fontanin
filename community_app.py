"""
Entry point FastAPI per il Community Module di Fine di Mondo APS.
Deployato come servizio separato su Cloud Run: freedomrun-community.

Avvio locale:
  uvicorn community_app:app --host 0.0.0.0 --port 8081 --reload
"""

import os
import logging
from dotenv import load_dotenv

load_dotenv(".env.local")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from community_module.community_main import community_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fine di Mondo APS — Community API",
    description="Forum, Chat, Esperimenti Sociali, Gestione Eventi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Lista esplicita dei domini per evitare errori CORS dovuti all'uso di allow_credentials=True con wildcard
origins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "https://el-fontanin.web.app",
    "https://el-fontanin.firebaseapp.com",
    "https://il-fontanin.vercel.app",
]

cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    # Aggiunge eventuali domini extra specificati nelle variabili d'ambiente
    origins.extend([o.strip() for o in cors_origins_env.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(community_router)


@app.get("/")
def root():
    return {
        "service": "Fine di Mondo Community API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/community/auth",
            "forum": "/community/forum",
            "chat": "/community/chat",
            "events": "/community/events",
            "research": "/community/research",
            "admin": "/community/admin",
        },
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8081))
    uvicorn.run("community_app:app", host="0.0.0.0", port=port, reload=False)
