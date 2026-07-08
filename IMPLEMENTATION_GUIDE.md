# GUIDA IMPLEMENTAZIONE DETERMINISTICA - SEZIONE MEDIA

## FASE 1: Setup OAuth & Google APIs

### 1.1 Google Cloud Console Configuration

**File da creare/modificare**: `.env.example`

```bash
# Google APIs
VITE_GOOGLE_PICKER_API_KEY=AIzaSy... # Chiave API browser
VITE_GOOGLE_APP_ID=123456789.apps... # OAuth Client ID
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' # Backend
```

**Step**:
1. Accedi a Google Cloud Console (el-fontanin project)
2. Menu → APIs & Services → Library
3. Cerca e abilita:
   - **Google Drive API** (se disabilitato)
   - **Google Picker API** (se disabilitato)
4. Menu → APIs & Services → Credentials
5. Crea OAuth 2.0 Client ID (se non esiste):
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:5173/media/drive-callback`
     - `http://localhost:3000/media/drive-callback`
     - `https://el-fontanin.web.app/media/drive-callback`
6. Scarica JSON, copia `client_id` in `.env.example` come `VITE_GOOGLE_APP_ID`
7. Crea/scarica chiave API pubblica:
   - Restrictions: HTTP referrers
   - Copia in `.env.example` come `VITE_GOOGLE_PICKER_API_KEY`

**Verifica**:
```bash
# In browser console (localhost:5173)
console.log(import.meta.env.VITE_GOOGLE_APP_ID)  # deve essere present
console.log(import.meta.env.VITE_GOOGLE_PICKER_API_KEY)  # deve essere present
```

### 1.2 Service Account Setup (Backend)

**Step**:
1. Google Cloud Console → Service Accounts
2. Crea nuovo service account "el-fontanin-media"
3. Grant role: `Editor` (su GCP project)
4. Create JSON key → scarica
5. GCP Secret Manager → Create Secret "google-service-account-json"
6. Paste JSON content → save
7. Deploy backend avrà accesso via `os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON')`

**Verifica**:
```bash
# Backend setup
export GOOGLE_SERVICE_ACCOUNT_JSON='...'
python3 -c "
from src.services.google_drive_service import GoogleDriveService
svc = GoogleDriveService()
print('✓ Service account loaded')
"
```

### 1.3 Firestore Security Rules

**File da creare**: `firestore.rules` (snippet media)

```
match /communities/{cid}/media/{mid} {
  allow read: if
    resource.data.visibility == 'public' ||
    request.auth.uid == resource.data.owner_id ||
    request.auth.uid in resource.data.access_list.user_ids;
  
  allow write: if
    request.auth.uid == resource.data.owner_id;
  
  allow delete: if
    request.auth.uid == resource.data.owner_id ||
    'admin' in request.auth.token.ruoli;
}

match /communities/{cid}/media_audit_log/{entry_id} {
  allow read: if
    request.auth.uid == resource.data.actor_id ||
    'admin' in request.auth.token.ruoli;
  
  allow create: if request.auth.uid != null;
}
```

**Deploy**:
```bash
firebase deploy --only firestore:rules
```

### 1.4 Firestore Indexes

**File da creare**: `firestore.indexes.json` (snippet)

```json
{
  "indexes": [
    {
      "collectionGroup": "media",
      "queryScope": "Collection",
      "fields": [
        {"fieldPath": "community_id", "order": "ASCENDING"},
        {"fieldPath": "visibility", "order": "ASCENDING"},
        {"fieldPath": "created_at", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "media",
      "queryScope": "Collection",
      "fields": [
        {"fieldPath": "community_id", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"}
      ]
    }
  ]
}
```

**Deploy**:
```bash
firebase deploy --only firestore:indexes
```

---

## FASE 2: Schema Firestore

### 2.1 Pydantic Models (Backend)

**File da creare**: `src/models/media.py`

```python
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List

class AuditEntry(BaseModel):
    action: str  # created, viewed, downloaded, deleted, flagged
    actor_id: str
    timestamp: datetime
    details: dict = {}

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
    
    @validator('mime_type')
    def validate_mime(cls, v):
        allowed = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg']
        if v not in allowed:
            raise ValueError(f'MIME type {v} not allowed')
        return v
    
    @validator('size_bytes')
    def validate_size(cls, v):
        if v > 500 * 1024 * 1024:  # 500MB
            raise ValueError('File too large')
        return v
```

### 2.2 Firestore Document Reference

**File da creare**: `docs/MEDIA_SCHEMA.md`

```markdown
# Firestore Schema - Media Collection

## `/communities/{cid}/media/{media_id}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | auto | Firestore doc ID |
| type | string | ✓ | "personal_link" \| "collective_upload" |
| owner_id | string | ✓ | User ID who created |
| community_id | string | ✓ | Parent community |
| name | string | ✓ | File name |
| description | string | | Optional description |
| mime_type | string | ✓ | image/jpeg, video/mp4, etc |
| size_bytes | number | ✓ | File size in bytes |
| drive_file_id | string | conditional | Google Drive file ID (personal_link) |
| drive_path | string | conditional | Path in Drive Fontanin (collective) |
| cache_gcs_url | string | | GCS thumbnail URL |
| visibility | string | ✓ | "public" \| "private" |
| access_list | object | | {user_ids: [], roles: []} |
| status | string | ✓ | "active" \| "deleted" \| "flagged" |
| deleted_at | timestamp | | Soft delete timestamp |
| deleted_by | string | | Moderator ID who deleted |
| delete_reason | string | | Deletion reason |
| created_at | timestamp | ✓ | Creation timestamp |
| updated_at | timestamp | ✓ | Last update timestamp |
| audit_trail | array | ✓ | [{action, actor_id, timestamp, details}] |

### Example Document

\`\`\`json
{
  "type": "personal_link",
  "owner_id": "user123",
  "community_id": "fontanin-main",
  "name": "Pulizia area risorsa 2024-06.jpg",
  "description": "Attività manutenzione giugno",
  "mime_type": "image/jpeg",
  "size_bytes": 2048000,
  "drive_file_id": "1A2B3C4D5E6F7G8H9I0J",
  "visibility": "public",
  "status": "active",
  "created_at": "2024-06-15T10:30:00Z",
  "updated_at": "2024-06-15T10:30:00Z",
  "audit_trail": [
    {
      "action": "created",
      "actor_id": "user123",
      "timestamp": "2024-06-15T10:30:00Z",
      "details": {
        "type": "personal_link",
        "drive_file_id": "1A2B3C4D5E6F7G8H9I0J"
      }
    }
  ]
}
\`\`\`

## `/communities/{cid}/media_audit_log/{entry_id}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| media_id | string | ✓ | Reference to media doc |
| action | string | ✓ | created, viewed, downloaded, deleted |
| actor_id | string | ✓ | User performing action |
| timestamp | timestamp | ✓ | When action occurred |
| details | object | | Additional context |

### Example Entry

\`\`\`json
{
  "media_id": "media123",
  "action": "deleted",
  "actor_id": "admin456",
  "timestamp": "2024-06-20T14:00:00Z",
  "details": {
    "reason": "Violates community guidelines",
    "moderator_note": "Inappropriate content"
  }
}
\`\`\`
```

---

## FASE 3: Frontend Components

### 3.1 MediaContext Setup

**File da creare**: `src/context/MediaContext.jsx`

**Minimale**:
```javascript
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const MediaContext = createContext(null)

export function MediaProvider({ children }) {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ visibility: 'all', type: 'all' })

  const loadMedia = async () => {
    setLoading(true)
    try {
      const res = await api.get('/media', { params: filters })
      setMedia(res.data)
      localStorage.setItem('media_cache', JSON.stringify(res.data))
    } catch (err) {
      console.error('Error loading media:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedia()
  }, [filters])

  return (
    <MediaContext.Provider value={{ media, loading, filters, setFilters, loadMedia }}>
      {children}
    </MediaContext.Provider>
  )
}

export function useMedia() {
  return useContext(MediaContext)
}
```

### 3.2 MediaCard Component

**File da creare**: `src/components/MediaCard.jsx`

**Minimale**:
```javascript
import { useAuth } from '../context/AuthContext'

export default function MediaCard({ media, onDelete }) {
  const { user } = useAuth()
  const isOwner = media.owner_id === user?.id

  return (
    <div className="rounded-lg overflow-hidden border border-stone-200">
      {/* Thumbnail */}
      <div className="h-40 bg-stone-100 flex items-center justify-center">
        <img
          src={media.cache_gcs_url || '/placeholder.png'}
          alt={media.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Metadata */}
      <div className="p-3">
        <h3 className="font-medium text-sm">{media.name}</h3>
        <p className="text-xs text-stone-500">{media.visibility}</p>
        {isOwner && (
          <button
            onClick={() => onDelete(media.id)}
            className="text-xs text-red-600 mt-2"
          >
            Elimina
          </button>
        )}
      </div>
    </div>
  )
}
```

### 3.3 MediaGallery Page

**File da creare**: `src/pages/Media.jsx`

**Minimale**:
```javascript
import { useMedia } from '../context/MediaContext'
import MediaCard from '../components/MediaCard'

export default function Media() {
  const { media, loading } = useMedia()

  if (loading) return <div>Caricamento...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Media</h1>
      <div className="grid grid-cols-2 gap-4">
        {media.map(m => (
          <MediaCard key={m.id} media={m} onDelete={() => {}} />
        ))}
      </div>
    </div>
  )
}
```

### 3.4 Update App.jsx

**File da modificare**: `src/App.jsx`

```javascript
import Media from './pages/Media'
import { MediaProvider } from './context/MediaContext'

// Wrap in routes
<Route 
  path="/media" 
  element={<MediaProvider><Media /></MediaProvider>} 
/>
```

---

## FASE 4: Backend Endpoints

### 4.1 Main Route File

**File da creare**: `src/routes/media.py`

**Minimale**:
```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from src.services.media_service import MediaService
from src.core.security import get_current_user

router = APIRouter(prefix="/media", tags=["media"])
media_service = MediaService()

@router.get("")
async def list_media(current_user = Depends(get_current_user)):
    community_id = current_user['community_id']
    return media_service.query_media(community_id)

@router.post("/link-personal")
async def link_personal(data: dict, current_user = Depends(get_current_user)):
    media_id = media_service.create_personal_link(
        community_id=current_user['community_id'],
        owner_id=current_user['user_id'],
        **data
    )
    return {"id": media_id, "status": "created"}

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    visibility: str = Form('public'),
    current_user = Depends(get_current_user)
):
    media_id = media_service.create_collective_upload(
        file=file,
        community_id=current_user['community_id'],
        owner_id=current_user['user_id'],
        visibility=visibility
    )
    return {"id": media_id, "status": "created"}

@router.delete("/{media_id}")
async def delete_media(media_id: str, current_user = Depends(get_current_user)):
    media_service.delete_media(
        media_id=media_id,
        community_id=current_user['community_id'],
        deleted_by=current_user['user_id']
    )
    return {"status": "deleted"}
```

### 4.2 Register Route in Main App

**File da modificare**: `src/main.py`

```python
from src.routes.media import router as media_router
app.include_router(media_router)
```

---

## FASE 5: Testing

### 5.1 Frontend Unit Test

**File da creare**: `src/components/__tests__/MediaCard.test.jsx`

```javascript
import { render, screen } from '@testing-library/react'
import MediaCard from '../MediaCard'
import * as AuthContext from '../../context/AuthContext'

describe('MediaCard', () => {
  it('renders media name', () => {
    const mockMedia = { id: '1', name: 'Test', visibility: 'public', owner_id: 'user1' }
    render(<MediaCard media={mockMedia} onDelete={() => {}} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### 5.2 Backend Integration Test

**File da creare**: `tests/test_media_endpoints.py`

```python
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_list_media(auth_token):
    response = client.get("/media", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200

def test_upload_media(auth_token):
    response = client.post("/media/upload",
        headers={"Authorization": f"Bearer {auth_token}"},
        data={"visibility": "public"},
        files={"file": ("test.jpg", b"fake image")}
    )
    assert response.status_code == 200
```

---

## CHECKLIST PER OGNI FASE

### Fase 1
- [ ] `.env.example` aggiornato con chiavi Google
- [ ] Service account key in GCP Secret Manager
- [ ] `firestore.rules` deployed
- [ ] `firestore.indexes.json` deployed
- [ ] Test: API keys caricati in frontend console

### Fase 2
- [ ] `src/models/media.py` completato
- [ ] `docs/MEDIA_SCHEMA.md` documentato
- [ ] Firestore test document creato manualmente

### Fase 3
- [ ] `MediaContext.jsx` crea e carica media
- [ ] `MediaCard.jsx` renderizza con thumbnail
- [ ] `Media.jsx` page visible in app
- [ ] BottomNav ha link a /media
- [ ] `npm run build` succeeds
- [ ] Unit tests passano

### Fase 4
- [ ] `GET /media` returns array
- [ ] `POST /media/link-personal` crea record
- [ ] `POST /media/upload` carica file
- [ ] `DELETE /media/{id}` marca deleted
- [ ] Firestore documents created
- [ ] Audit trail logged
- [ ] Integration tests passano

### Fase 5
- [ ] Test coverage > 80%
- [ ] Frontend build succeeds (`npm run build`)
- [ ] No console errors in staging
- [ ] Manual E2E test completed
- [ ] `DEPLOY_CHECKLIST.md` signed off

---

## COMANDI RAPIDI

```bash
# Frontend dev
npm run dev

# Frontend test
npm run test

# Frontend build
npm run build

# Backend test
pytest tests/

# Backend run
python3 -m uvicorn src.main:app --reload

# Deploy Firestore
firebase deploy --only firestore:indexes,firestore:rules

# Deploy frontend (Firebase Hosting)
npm run build
firebase deploy --only hosting --project el-fontanin
```
