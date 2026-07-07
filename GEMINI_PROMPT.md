# PROMPT PER GEMINI/ANTIGRAVITY - SEZIONE MEDIA

## TASK
Implementare sezione **Media** (foto/video/audio personale e collettiva) in app React El Fontanin secondo architettura sistematica e deterministica.

## CONTESTO PROGETTO
- **App**: El Fontanin (React + Firebase/Firestore + Vercel)
- **Stack**: React 18, Firebase SDK, Vite, i18next (8 lingue)
- **GCP Project**: `freedomrun-491323`
- **Repo**: `D:\Progetti GCloud\fontanin\`
- **Vercel deployment**: `il-fontanin.vercel.app`

## REQUISITI CONSOLIDATI
1. **Media personali**: ogni membro collega suo Google Drive via OAuth (Google Picker API)
2. **Media collettivi**: ibrido — raccolta link personali pubblici + upload su Drive Fontanin dedicato
3. **Storage**: media personali su Drive personale (non appesantire GCloud Fontanin)
4. **Permessi**: visibilità pubblica/privata, moderatori possono eliminare, audit trail in Firestore
5. **Integrazione**: Google Drive API (personal + service account), Firestore metadati, GCS cache thumbnails (opzionale)

## ARCHITETTURA SISTEMICA

### Componenti Frontend
```
src/context/MediaContext.jsx           — State + cache localStorage
src/components/MediaCard.jsx           — Display singolo media
src/components/MediaGallery.jsx        — Gallery con filtri
src/components/MediaUploader.jsx       — Upload form
src/components/MediaPickerGoogle.jsx   — Google Picker wrapper
src/components/ModerationPanel.jsx     — Panel moderazione
src/pages/Media.jsx                    — Page principale
src/lib/googlePickerLoader.js          — Lazy load Google Picker
```

### Componenti Backend
```
src/routes/media.py                    — FastAPI endpoints (CRUD)
src/services/media_service.py          — Business logic
src/services/google_drive_service.py   — Google Drive API client
src/services/audit_logger.py           — Audit trail logging
src/models/media.py                    — Pydantic schemas
```

### Data Model Firestore
```
/communities/{cid}/media/{media_id}
  ├─ type: "personal_link" | "collective_upload"
  ├─ owner_id, name, mime_type, size_bytes
  ├─ drive_file_id (personal) | drive_path (collective)
  ├─ visibility: "public" | "private"
  ├─ status: "active" | "deleted" | "flagged"
  ├─ created_at, updated_at
  └─ audit_trail: [{action, actor_id, timestamp, details}]

/communities/{cid}/media_audit_log/{entry_id}
  └─ media_id, action, actor_id, timestamp, details
```

## FASI IMPLEMENTAZIONE

### FASE 1: Setup OAuth & Google APIs (1-2 gg)
**Output**: credenziali, config env, security rules

**Step**:
1. Google Cloud Console: abilita Google Drive API, Google Picker API
2. OAuth 2.0: aggiungi redirect URI (`https://il-fontanin.vercel.app/media/drive-callback`)
3. Service account: scarica JSON key, carica in Secret Manager GCP
4. `.env.example` aggiornato con chiavi
5. `firestore.indexes.json` con query indexes
6. Security rules Firestore per media access

**Deliverables**:
- ✅ `.env.example` aggiornato
- ✅ `firestore.indexes.json` deployabile
- ✅ `firestore.rules` snippet media

---

### FASE 2: Schema Firestore (1 gg)
**Output**: modelli dati, collection setup, migration script

**Step**:
1. `src/models/media.py` — Pydantic schema completo
2. `src/lib/firestore_schema.js` — schema JS reference per frontend
3. Migration script: `scripts/migrate_firestore_schema.py` (opzionale, per future changes)
4. Validazione schema in backend prima Firestore write

**Deliverables**:
- ✅ `src/models/media.py` con Pydantic BaseModel
- ✅ `src/lib/firestore_schema.js` type reference
- ✅ Schema documentato in `docs/MEDIA_SCHEMA.md`

---

### FASE 3: Frontend Components (3-4 gg)
**Output**: UI completa, state management, integrazioni Google Picker

**Step**:
1. `MediaContext.jsx` — createContext, localStorage cache, load/save/delete logic
2. `MediaCard.jsx` — component display, thumbnail, actions (edit/delete)
3. `MediaGallery.jsx` — grid, filtri visibility/type, lazy load
4. `MediaUploader.jsx` — form file upload, visibility selector, description
5. `MediaPickerGoogle.jsx` — Google Picker wrapper OAuth
6. `ModerationPanel.jsx` — moderator-only delete panel
7. `src/pages/Media.jsx` — page layout, tab routing (gallery/upload/moderation)
8. `App.jsx` aggiornato con rotta `/media`
9. `BottomNav.jsx` aggiornato con link Media

**Deliverables**:
- ✅ Tutti componenti implementati
- ✅ LocalStorage cache working
- ✅ Google Picker API caricata correttamente
- ✅ Tests: `src/components/__tests__/MediaCard.test.jsx`

---

### FASE 4: Backend Integration (3-4 gg)
**Output**: API endpoints, Google Drive integration, audit logging

**Step**:
1. `src/services/google_drive_service.py` — client Google Drive API, metodi:
   - `get_file_metadata(file_id)` — valida file
   - `create_shared_link(file_id)` — rendi pubblico
   - `upload_file_to_fontanin_drive(content, filename, mime_type, community_id)` — upload service account
   - `download_file(file_id)` — download con streaming
   - `delete_file(file_id)` — elimina

2. `src/services/media_service.py` — CRUD logic:
   - `create_personal_link()` — new personal media record
   - `create_collective_upload()` — new collective record
   - `query_media(filters)` — list con paginazione
   - `get_media(id)` — single record
   - `delete_media(id, reason)` — soft delete

3. `src/services/audit_logger.py` — audit trail:
   - `log_action(community_id, media_id, action, actor_id, details)`

4. `src/routes/media.py` — FastAPI endpoints:
   - `GET /media` — query con filtri
   - `POST /media/link-personal` — link file da Google Drive
   - `POST /media/upload` — upload file su Drive Fontanin
   - `DELETE /media/{id}` — delete media
   - `GET /media/{id}/download` — download con audit
   - `GET /media/moderation/list` — moderator view (solo admin)

5. Error handling, rate limiting, input validation

**Deliverables**:
- ✅ Tutti endpoints testati
- ✅ Google Drive API calls working
- ✅ Firestore writes con audit trail
- ✅ Tests: `tests/test_media_endpoints.py`

---

### FASE 5: Testing & Deployment (2-3 gg)
**Output**: test coverage, deployment ready, monitoring

**Step**:
1. Unit tests:
   - Frontend: MediaCard, MediaGallery, MediaUploader
   - Backend: media_service, google_drive_service
   
2. Integration tests:
   - Upload flow (file → Backend → Drive → Firestore)
   - Link personal (Google Picker → Backend → Firestore)
   - Delete flow (moderator action → soft delete)
   - Audit trail populated

3. E2E tests (Playwright):
   - User login → upload file → gallery display
   - Share personal file → visibility change
   - Moderator delete → verify deleted

4. Deployment:
   - Build checks (npm run build)
   - Vercel deployment (staging + prod)
   - Firestore indexes deployed
   - Monitoring Sentry configured

**Deliverables**:
- ✅ Test coverage > 80%
- ✅ `DEPLOY_CHECKLIST.md` completato
- ✅ Zero console errors in prod
- ✅ Audit logs in Firestore per tutte azioni

---

## VINCOLI E ASSUNZIONI
- **NODE_ENV**: `npm install --include=dev` su PC (devDependencies)
- **GitHub**: non disponibile come MCP, usare Desktop Commander per validation/build
- **GCloud**: non appesantire — media personali su Drive user, collettivi su Drive Fontanin
- **Multilingua**: componenti UI leggibili da i18next (keys in it/en/...)
- **RTL support**: verificare on layout Media (visibility badge positions)

## TESTING CHECKLIST

### Unit Tests
- [ ] MediaCard renders media name + visibility badge
- [ ] MediaGallery filters by visibility/type
- [ ] MediaUploader validates file size < 500MB
- [ ] MediaContext cache localStorage
- [ ] google_drive_service.get_file_metadata() valida file
- [ ] media_service.query_media() filtra community_id

### Integration Tests
- [ ] POST /media/link-personal → Firestore record created
- [ ] POST /media/upload → file in Drive Fontanin + Firestore record
- [ ] DELETE /media/{id} → soft delete + audit trail
- [ ] GET /media → return filtered list
- [ ] Audit log entries per ogni action

### E2E Tests
- [ ] User login → navigate /media → gallery visible
- [ ] Click "Apri Google Picker" → Google Picker dialog opens
- [ ] Select file → POST /media/link-personal succeeds
- [ ] File appears in gallery within 2s
- [ ] Click delete → confirmation → media deleted
- [ ] Audit log shows delete action

## FILE DI RIFERIMENTO

Leggi questi file per contesto completo:
- `IMPLEMENTATION_GUIDE.md` — step-by-step deterministico
- `REQUIREMENTS.md` — requisiti tecnici dettagliati
- `TEST_SPEC.md` — specifiche test complete
- `docs/MEDIA_SCHEMA.md` — schema Firestore documentato
- `DEPLOY_CHECKLIST.md` — deployment checklist

## OUTPUT ATTESO

Al termine di ogni fase:
1. **Codice**: commit git con messaggio descrittivo
2. **Test**: tutti test passano (`npm run test`, `pytest tests/`)
3. **Docs**: componenti/endpoint documentati con docstring
4. **Review**: codice pronto per code review

## RISORSE ESTERNE
- Google Drive API docs: https://developers.google.com/drive/api/v3/about-sdk
- Google Picker API docs: https://developers.google.com/picker/docs
- Firebase Firestore docs: https://firebase.google.com/docs/firestore
- FastAPI docs: https://fastapi.tiangolo.com/

## CONTATTI & SUPPORT
- Project Owner: Daniel Giardina (daniel.giardina@gmail.com)
- Repo: D:\Progetti GCloud\fontanin\
- Environments: dev (localhost:5173), staging (vercel preview), prod (il-fontanin.vercel.app)

---

**Inizio sviluppo**: Fase 1 (Setup OAuth)  
**Timeline estimato**: 10-14 giorni (sequenziale) | 6-8 giorni (Fase 3+4 parallele)  
**Go/No-Go decision**: Dopo Fase 1, verificare OAuth setup funzionante
