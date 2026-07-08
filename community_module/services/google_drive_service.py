import json
import os
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

class GoogleDriveService:
    def __init__(self):
        self.service = None
        self.folder_id = os.getenv("GOOGLE_DRIVE_FONTANIN_FOLDER_ID")
        
        sa_json_str = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        if sa_json_str:
            try:
                # Handle possible single-quotes surrounding JSON
                if sa_json_str.startswith("'") and sa_json_str.endswith("'"):
                    sa_json_str = sa_json_str[1:-1]
                info = json.loads(sa_json_str)
                scopes = ["https://www.googleapis.com/auth/drive"]
                creds = service_account.Credentials.from_service_account_info(info, scopes=scopes)
                self.service = build("drive", "v3", credentials=creds)
            except Exception as e:
                print(f"Error loading service account credentials: {e}")
        else:
            # Fallback or local dev
            print("GOOGLE_SERVICE_ACCOUNT_JSON not set")
                
    def upload_file(self, filename: str, content: bytes, mime_type: str) -> dict:
        if not self.service:
            raise Exception("Google Drive Service not initialized")
            
        file_metadata = {
            "name": filename,
            "parents": [self.folder_id] if self.folder_id else []
        }
        
        fh = io.BytesIO(content)
        media = MediaIoBaseUpload(fh, mimetype=mime_type, resumable=True)
        
        try:
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields="id, webViewLink, webContentLink"
            ).execute()
            return file
        except Exception as e:
            raise Exception(f"Failed to upload file to Google Drive: {e}")
            
    def delete_file(self, file_id: str):
        if not self.service:
            raise Exception("Google Drive Service not initialized")
        try:
            self.service.files().delete(fileId=file_id).execute()
        except Exception as e:
            raise Exception(f"Failed to delete file from Google Drive: {e}")
