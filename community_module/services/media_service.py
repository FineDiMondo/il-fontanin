import os
import json
from uuid import uuid4
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import firestore, credentials
from community_module.services.google_drive_service import GoogleDriveService
from community_module.services.audit_logger import AuditLogger

class MediaService:
    def __init__(self):
        self.drive_service = GoogleDriveService()
        self.audit_logger = AuditLogger()
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
            print(f"Error initializing Firestore in MediaService: {e}")

    def query_media(self, community_id: str, visibility: str = 'all', media_type: str = 'all') -> list:
        if not self.db:
            return []
        
        ref = self.db.collection("communities").document(community_id).collection("media")
        query = ref.where("status", "==", "active")
        
        # Filter visibility
        if visibility != 'all':
            query = query.where("visibility", "==", visibility)
        
        # Filter type
        if media_type != 'all':
            query = query.where("type", "==", media_type)
            
        docs = query.order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        
        results = []
        for doc in docs:
            d = doc.to_dict()
            d['id'] = doc.id
            if 'created_at' in d and hasattr(d['created_at'], 'isoformat'):
                d['created_at'] = d['created_at'].isoformat()
            if 'updated_at' in d and hasattr(d['updated_at'], 'isoformat'):
                d['updated_at'] = d['updated_at'].isoformat()
            results.append(d)
        return results

    def create_personal_link(self, community_id: str, owner_id: str, name: str, mime_type: str, size_bytes: int, drive_file_id: str, visibility: str = 'public', description: str = '') -> str:
        if not self.db:
            raise Exception("Firestore not initialized")
            
        media_id = str(uuid4())
        now = datetime.now(timezone.utc)
        
        record = {
            "id": media_id,
            "type": "personal_link",
            "owner_id": owner_id,
            "community_id": community_id,
            "name": name,
            "description": description,
            "mime_type": mime_type,
            "size_bytes": size_bytes,
            "drive_file_id": drive_file_id,
            "visibility": visibility,
            "status": "active",
            "created_at": now,
            "updated_at": now,
            "access_list": {"user_ids": [], "roles": []},
            "audit_trail": [{
                "action": "created",
                "actor_id": owner_id,
                "timestamp": now,
                "details": {"type": "personal_link", "drive_file_id": drive_file_id}
            }]
        }
        
        self.db.collection("communities").document(community_id).collection("media").document(media_id).set(record)
        self.audit_logger.log_action(community_id, media_id, owner_id, "created", {"type": "personal_link", "drive_file_id": drive_file_id})
        return media_id

    def create_collective_upload(self, filename: str, content: bytes, mime_type: str, size_bytes: int, community_id: str, owner_id: str, visibility: str = 'public', description: str = '') -> str:
        if not self.db:
            raise Exception("Firestore not initialized")
            
        drive_file = self.drive_service.upload_file(filename, content, mime_type)
        drive_file_id = drive_file.get("id")
        drive_link = drive_file.get("webViewLink")
        
        media_id = str(uuid4())
        now = datetime.now(timezone.utc)
        
        record = {
            "id": media_id,
            "type": "collective_upload",
            "owner_id": owner_id,
            "community_id": community_id,
            "name": filename,
            "description": description,
            "mime_type": mime_type,
            "size_bytes": size_bytes,
            "drive_file_id": drive_file_id,
            "cache_gcs_url": drive_link,
            "visibility": visibility,
            "status": "active",
            "created_at": now,
            "updated_at": now,
            "access_list": {"user_ids": [], "roles": []},
            "audit_trail": [{
                "action": "created",
                "actor_id": owner_id,
                "timestamp": now,
                "details": {"type": "collective_upload", "drive_file_id": drive_file_id}
            }]
        }
        
        self.db.collection("communities").document(community_id).collection("media").document(media_id).set(record)
        self.audit_logger.log_action(community_id, media_id, owner_id, "created", {"type": "collective_upload", "drive_file_id": drive_file_id})
        return media_id

    def delete_media(self, media_id: str, community_id: str, deleted_by: str, reason: str = ''):
        if not self.db:
            raise Exception("Firestore not initialized")
            
        doc_ref = self.db.collection("communities").document(community_id).collection("media").document(media_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise Exception("Media not found")
            
        data = doc.to_dict()
        now = datetime.now(timezone.utc)
        
        if data.get("type") == "collective_upload" and data.get("drive_file_id"):
            try:
                self.drive_service.delete_file(data.get("drive_file_id"))
            except Exception as e:
                print(f"Error deleting file from Google Drive: {e}")
                
        update_data = {
            "status": "deleted",
            "deleted_at": now,
            "deleted_by": deleted_by,
            "delete_reason": reason,
            "updated_at": now
        }
        doc_ref.update(update_data)
        self.audit_logger.log_action(community_id, media_id, deleted_by, "deleted", {"reason": reason})
