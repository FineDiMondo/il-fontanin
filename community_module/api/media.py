from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from community_module.services.media_service import MediaService
from community_module.models.community_models import CommunityUser
from community_module.auth.community_auth import require_socio, get_current_user_optional

router = APIRouter(prefix="/media", tags=["media"])
media_service = MediaService()

@router.get("", openapi_extra={"security": []})
def list_media(
    visibility: str = Query("all"),
    type: str = Query("all"),
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional)
):
    # Set default community_id. Since we only have one main community for El Fontanin:
    community_id = "el-fontanin"
    
    # Non-soci/guests can only see public media
    is_socio = current_user and current_user.ruolo in ("socio", "admin")
    if not is_socio:
        visibility = "public"
        
    return media_service.query_media(community_id, visibility, type)

@router.post("/link-personal")
def link_personal(
    name: str = Form(...),
    mime_type: str = Form(...),
    size_bytes: int = Form(...),
    drive_file_id: str = Form(...),
    visibility: str = Form("public"),
    description: str = Form(""),
    current_user: CommunityUser = Depends(require_socio)
):
    community_id = "el-fontanin"
    try:
        media_id = media_service.create_personal_link(
            community_id=community_id,
            owner_id=str(current_user.id),
            name=name,
            mime_type=mime_type,
            size_bytes=size_bytes,
            drive_file_id=drive_file_id,
            visibility=visibility,
            description=description
        )
        return {"id": media_id, "status": "created"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload")
def upload_media(
    file: UploadFile = File(...),
    visibility: str = Form("public"),
    description: str = Form(""),
    current_user: CommunityUser = Depends(require_socio)
):
    community_id = "el-fontanin"
    try:
        content = file.file.read()
        media_id = media_service.create_collective_upload(
            filename=file.filename,
            content=content,
            mime_type=file.content_type,
            size_bytes=len(content),
            community_id=community_id,
            owner_id=str(current_user.id),
            visibility=visibility,
            description=description
        )
        return {"id": media_id, "status": "created"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{media_id}")
def delete_media(
    media_id: str,
    current_user: CommunityUser = Depends(require_socio)
):
    community_id = "el-fontanin"
    try:
        media_service.delete_media(
            media_id=media_id,
            community_id=community_id,
            deleted_by=str(current_user.id)
        )
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
