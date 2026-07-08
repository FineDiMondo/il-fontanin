import os
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import firestore, credentials

class AuditLogger:
    def __init__(self):
        self.db = None
        try:
            if not firebase_admin._apps:
                service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
                if service_account_path:
                    cred = credentials.Certificate(service_account_path)
                else:
                    cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred)
            self.db = firestore.client()
        except Exception as e:
            print(f"Error initializing Firestore in AuditLogger: {e}")

    def log_action(self, community_id: str, media_id: str, actor_id: str, action: str, details: dict = None):
        if not self.db:
            print("Firestore client not initialized, skipping log")
            return
        
        entry = {
            "media_id": media_id,
            "action": action,
            "actor_id": actor_id,
            "timestamp": datetime.now(timezone.utc),
            "details": details or {}
        }
        
        try:
            self.db.collection("communities").document(community_id).collection("media_audit_log").add(entry)
        except Exception as e:
            print(f"Failed to log audit entry to Firestore: {e}")
