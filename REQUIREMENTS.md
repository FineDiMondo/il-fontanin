# REQUISITI TECNICI - SEZIONE MEDIA

## REQUISITI FUNZIONALI

### RF.1 Media Personali
- [ ] Utente collega Google Drive personale via OAuth
- [ ] Google Picker API permette selezione file da Drive
- [ ] File non viene uploadato, solo linkedato (file remains on user Drive)
- [ ] Metadati memorizzati in Firestore
- [ ] File personali accessibili via Drive URL pubblico

### RF.2 Media Collettivi
- [ ] Utente può uploadare file direttamente all'app
- [ ] File viene salvato su Drive Fontanin (service account)
- [ ] Metadati memorizzati in Firestore
- [ ] Supporta drag-and-drop upload

### RF.3 Visibilità & Permessi
- [ ] Ogni media ha visibilità: `public` (tutta community) | `private` (solo owner)
- [ ] Owner può modificare visibilità
- [ ] Moderatori/Admin possono eliminare qualsiasi media
- [ ] Firestore security rules enforce accesso

### RF.4 Gallery & Browse
- [ ] Galleria mostra media pubblici per default
- [ ] Filtri: visibility (public/private/all), type (personal/collective/all)
- [ ] Lazy load thumbnails
- [ ] Paginazione (limit 50 per page)
- [ ] Ordinamento: newest first

### RF.5 Moderation
- [ ] Moderatori vedono panel con flag/delete options
- [ ] Delete media soft-deletes (non cancella Drive file, marca in DB)
- [ ] Collective uploads hard-delete da Drive
- [ ] Moderatori vedono audit log

### RF.6 Audit Trail
- [ ] Ogni azione loggata: created, viewed, downloaded, deleted
- [ ] Log contiene: media_id, actor_id, action, timestamp, details
- [ ] Admin può queryare audit log per compliance

---

## REQUISITI NON FUNZIONALI

### RNF.1 Performance
- [ ] Gallery load < 2s per primo render
- [ ] Lazy load thumbnails (caricamento asincrono)
- [ ] LocalStorage cache metadati (validità 5 minuti)
- [ ] Firestore query con indexes per performance

### RNF.2 Scalabilità
- [ ] Supporta 1000+ media per community
- [ ] Supporta 100+ concurrent users
- [ ] Google Drive API rate limiting handled (exponential backoff)
- [ ] Firestore batch operations per bulk actions

### RNF.3 Security
- [ ] OAuth 2.0 per Google Drive access (user-specific)
- [ ] Service account key in GCP Secret Manager (non in code)
- [ ] Firestore security rules enforce user permissions
- [ ] File size limit: 500MB max
- [ ] MIME type whitelist: image/*, video/mp4, audio/mpeg

### RNF.4 Reliability
- [ ] Error handling per Google Drive API failures
- [ ] Retry logic: exponential backoff (max 3 retries)
- [ ] Graceful degradation: gallery shows cached data if API down
- [ ] Audit trail non-critical (best effort logging)

### RNF.5 Multilingua & Accessibility
- [ ] UI strings via i18next (it, en, ar, pt, es, hi, ur, ne)
- [ ] RTL support verified (ar, ur, ne)
- [ ] Accessibility: alt text on images, ARIA labels
- [ ] Mobile responsive: grid 2 col phone, 3 col tablet

### RNF.6 Storage & Costs
- [ ] Personal media: 0 cost (resides on user Drive)
- [ ] Collective media: stored on Drive Fontanin (service account quota)
- [ ] Firestore: <10MB data per community (metadata only)
- [ ] GCS cache (optional): thumbnails only, 1MB per 100 files

---

## CONSTRAINTS

### C.1 Google APIs
- **Google Drive API**: OAuth 2.0 (users), Service Account (backend)
- **Google Picker API**: Browser-based, client-side auth
- **Scopes**:
  - User: `https://www.googleapis.com/auth/drive.readonly`
  - Backend: full Drive access via service account

### C.2 Firestore
- **Max doc size**: 1MB (audit_trail stored separately)
- **Max array size**: 20K elements (audit_trail should be manageable)
- **Indexes**: must be deployed before querying
- **Security rules**: must whitelist media access

### C.3 File Format & Size
- **Allowed MIME types**:
  - Images: image/jpeg, image/png, image/gif
  - Video: video/mp4
  - Audio: audio/mpeg
- **Max file size**: 500MB
- **Max uploads per day**: unlimited (Google Drive quota limits apply)

### C.4 Performance SLA
- **API response time**: < 1s (p95)
- **Gallery render**: < 2s (p95)
- **Upload time**: depends on file size + network

### C.5 Data Retention
- **Soft deletes**: retained in Firestore (marked deleted)
- **Hard deletes**: only for collective uploads (Drive files removed)
- **Audit log**: retained indefinitely for compliance
- **Cache**: 5 minute TTL (localStorage)

---

## ACCEPTANCE CRITERIA

### AC.1 Personal Media Link
Given: User has Google Drive file
When: User clicks "Apri Google Picker" → selects file → confirms
Then:
- [ ] Google Picker closes
- [ ] POST /media/link-personal succeeds (200 OK)
- [ ] Firestore record created with type="personal_link"
- [ ] Audit log entry "created" added
- [ ] File appears in gallery within 2s
- [ ] No file copied to Fontanin Drive

### AC.2 Collective Upload
Given: User has local file (< 500MB, supported format)
When: User clicks "Carica su Drive Fontanin" → selects file → confirms
Then:
- [ ] File uploaded to Drive Fontanin folder
- [ ] POST /media/upload succeeds (200 OK)
- [ ] Firestore record created with type="collective_upload"
- [ ] Audit log entry "created" added
- [ ] File appears in gallery within 2s
- [ ] File stored on service account Drive (Fontanin)

### AC.3 Gallery Display
Given: Community has 10+ public media
When: User navigates to /media
Then:
- [ ] Gallery displays first page (≤50 items)
- [ ] Thumbnails load progressively (lazy load)
- [ ] Filters (visibility, type) functional
- [ ] Pagination works (next page, previous page)
- [ ] Page loads < 2s

### AC.4 Delete Media (Owner)
Given: User is media owner
When: User clicks delete → confirms
Then:
- [ ] DELETE /media/{id} succeeds (200 OK)
- [ ] Firestore status="deleted"
- [ ] Media disappears from gallery
- [ ] Audit log entry "deleted" added

### AC.5 Delete Media (Moderator)
Given: Moderator is not media owner
When: Moderator clicks delete → provides reason → confirms
Then:
- [ ] DELETE /media/{id} succeeds (200 OK)
- [ ] Firestore status="deleted", deleted_by=moderator_id
- [ ] If collective: Drive file also deleted
- [ ] Audit log entry "deleted_by_moderator" added
- [ ] Media disappears from gallery

### AC.6 Visibility Control
Given: User is media owner
When: User changes visibility (public ↔ private)
Then:
- [ ] PATCH /media/{id} succeeds
- [ ] Firestore visibility updated
- [ ] Access control enforced (private: only owner sees)
- [ ] Audit log entry "visibility_changed" added

### AC.7 Audit Trail
Given: Moderator accesses audit log
When: Moderator queries GET /media/audit-log
Then:
- [ ] Returns all actions on media (created, deleted, viewed, etc)
- [ ] Filters work: media_id, action, actor_id, date range
- [ ] Timestamps accurate
- [ ] Export to CSV functional

---

## API SPECIFICATIONS

### GET /media
Query media with filters.

**Query params**:
- `visibility`: "public" | "private" | null (default all)
- `type`: "personal_link" | "collective_upload" | null (default all)
- `skip`: integer (default 0)
- `limit`: integer (default 50, max 100)
- `owner_id`: string (optional, filter by owner)

**Response** (200 OK):
```json
[
  {
    "id": "media123",
    "type": "personal_link",
    "owner_id": "user456",
    "name": "Photo.jpg",
    "mime_type": "image/jpeg",
    "size_bytes": 2048000,
    "visibility": "public",
    "drive_file_id": "1A2B3C...",
    "created_at": "2024-06-15T10:00:00Z"
  }
]
```

---

### POST /media/link-personal
Link file from personal Google Drive.

**Body**:
```json
{
  "drive_file_id": "1A2B3C...",
  "name": "File name",
  "mime_type": "image/jpeg",
  "visibility": "public",
  "description": "Optional description"
}
```

**Response** (200 OK):
```json
{
  "id": "media123",
  "type": "personal_link",
  "status": "created"
}
```

**Errors**:
- 400: Invalid file / file not found
- 403: User cannot access file
- 413: File too large

---

### POST /media/upload
Upload file to Fontanin Drive.

**Body** (multipart/form-data):
- `file`: binary file
- `visibility`: "public" | "private" (default "public")
- `description`: string (optional)

**Response** (200 OK):
```json
{
  "id": "media123",
  "type": "collective_upload",
  "status": "created",
  "drive_file_id": "2B3C4D..."
}
```

**Errors**:
- 400: Invalid file format
- 413: File too large (> 500MB)
- 500: Drive upload failed

---

### DELETE /media/{media_id}
Delete media (soft delete + hard delete for collective).

**Body**:
```json
{
  "reason": "Violates guidelines"
}
```

**Response** (200 OK):
```json
{
  "status": "deleted",
  "media_id": "media123"
}
```

**Errors**:
- 403: User not authorized
- 404: Media not found

---

### GET /media/{media_id}/download
Download media file with audit logging.

**Response** (200 OK):
- Streaming file content
- Content-Type: media.mime_type
- Content-Disposition: attachment; filename=...

**Audit**: "downloaded" action logged

---

### GET /media/moderation/list
List media for moderation (admin only).

**Query params**:
- `status`: "active" | "deleted" | "flagged" | null (all)

**Response** (200 OK):
```json
[
  {
    "id": "media123",
    "name": "...",
    "status": "flagged",
    "flagged_at": "2024-06-20T10:00:00Z",
    "flags_count": 3
  }
]
```

---

## ENVIRONMENT VARIABLES

```bash
# Frontend (.env)
VITE_GOOGLE_PICKER_API_KEY=AIzaSy...        # Public API key
VITE_GOOGLE_APP_ID=123456789.apps...        # OAuth Client ID

# Backend (.env)
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
FIRESTORE_PROJECT_ID=el-fontanin
GOOGLE_DRIVE_FONTANIN_FOLDER_ID=1A2B3C...   # Root folder for all uploads
```

---

## TESTING REQUIREMENTS

### Unit Test Coverage
- [ ] Components: MediaCard, MediaGallery, MediaUploader > 80%
- [ ] Services: google_drive_service, media_service > 80%
- [ ] Models: MediaRecord validation > 90%

### Integration Test Scenarios
- [ ] Full flow: Google Picker → API call → Firestore record → Gallery display
- [ ] Full flow: File upload → Drive write → Firestore record → Gallery display
- [ ] Delete flow: moderator action → soft delete → audit log → gallery update
- [ ] Error scenarios: API failures, rate limits, invalid files

### E2E Test Coverage
- [ ] User login → navigate /media → gallery visible
- [ ] Link personal file → appears in gallery
- [ ] Upload file → appears in gallery
- [ ] Delete file → disappears
- [ ] Filter by visibility → works
- [ ] Audit log → queries work

### Performance Tests
- [ ] Gallery load time < 2s (50 items)
- [ ] Thumbnail lazy load verified
- [ ] LocalStorage cache working
- [ ] API response time < 1s (p95)

---

## DEPLOYMENT CHECKLIST

- [ ] All tests passing
- [ ] Code review approved
- [ ] `.env` variables set (prod)
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Service account key in Secret Manager
- [ ] Vercel staging deployment successful
- [ ] No console errors in staging
- [ ] Manual E2E test in staging
- [ ] Vercel prod deployment successful
- [ ] Monitoring/logging configured (Sentry)
- [ ] Rollback plan documented

---

## KNOWN LIMITATIONS

1. **Google Drive quota**: User Drive quota limits apply to personal media
2. **Collective quota**: Fontanin Drive has shared quota for all uploads
3. **Picker API**: Only works in browsers (not mobile webview)
4. **Thumbnail caching**: GCS cache optional (cost trade-off)
5. **Audit log pruning**: Not automated (manual cleanup needed after 2 years)

---

## FUTURE ENHANCEMENTS

1. Batch upload (multiple files)
2. Video transcoding (thumbnail generation)
3. Image compression (auto-optimize)
4. Sharing with specific users (access_list)
5. Comments/ratings on media
6. Full-text search on filenames
7. Scheduled cleanup (archive old media)
8. WebP format for better compression
