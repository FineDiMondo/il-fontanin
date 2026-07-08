from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List, Dict, Any

class AuditEntry(BaseModel):
    action: str  # created, viewed, downloaded, deleted, flagged
    actor_id: str
    timestamp: datetime
    details: Dict[str, Any] = {}

class AccessList(BaseModel):
    user_ids: List[str] = []
    roles: List[str] = []  # editor, viewer

class MediaRecord(BaseModel):
    id: Optional[str] = None
    type: str  # personal_link, collective_upload
    owner_id: str
    community_id: str
    name: str
    description: Optional[str] = ""
    mime_type: str  # image/*, video/*, audio/*
    size_bytes: int
    drive_file_id: Optional[str] = None
    drive_path: Optional[str] = None
    cache_gcs_url: Optional[str] = None
    visibility: str = "public"  # public, private
    access_list: AccessList = AccessList()
    status: str = "active"  # active, deleted, flagged
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    delete_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    audit_trail: List[AuditEntry] = []

    @field_validator('mime_type')
    @classmethod
    def validate_mime(cls, v: str) -> str:
        allowed = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/mp3']
        # Also allow general patterns
        if not (v.startswith('image/') or v.startswith('video/') or v.startswith('audio/')):
            raise ValueError(f'MIME type {v} not allowed')
        return v

    @field_validator('size_bytes')
    @classmethod
    def validate_size(cls, v: int) -> int:
        if v > 500 * 1024 * 1024:  # 500MB
            raise ValueError('File too large')
        return v

    class Config:
        from_attributes = True
        populate_by_name = True
