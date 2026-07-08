# 🚀 MEDIA FEATURE - START HERE

## Quick Start for Gemini/Antigravity Development

Benvenuto! Questo documento guida lo sviluppo della sezione **Media** (foto/video/audio) per El Fontanin.

---

## 📋 FILE DI RIFERIMENTO (LEGGI IN QUESTO ORDINE)

1. **GEMINI_PROMPT.md** ← START HERE
   - Contesto completo del progetto
   - Requisiti consolidati (non negoziabili)
   - Architettura sistemica
   - Timeline e fasi

2. **REQUIREMENTS.md**
   - Requisiti funzionali (RF.1-6)
   - Requisiti non-funzionali (RNF.1-6)
   - Constraints (C.1-5)
   - Acceptance criteria (AC.1-7)
   - API specifications

3. **IMPLEMENTATION_GUIDE.md**
   - Step-by-step deterministico per ogni fase
   - Minimali code examples
   - Comandi rapidi
   - Checklist di completamento

4. **TEST_SPEC.md**
   - Unit tests per componenti/servizi
   - Integration tests per API
   - E2E tests (Playwright)
   - Performance tests
   - CI/CD pipeline

5. **EXPERIMENTAL_INTEGRATION.md**
   - Feature flag setup
   - Integrazione in "ESPERIMENTI ATTIVI"
   - Gradual rollout strategy (Phase 1-3)
   - Monitoring & telemetry
   - Rollback plan

6. **.env.example.media**
   - Variabili environment necessarie
   - Istruzioni su dove trovarle (Google Cloud Console)

---

## ⚙️ SETUP INIZIALE (5 MIN)

### Clona repo
```bash
git clone <repo-url>
cd D:\Progetti GCloud\fontanin
```

### Installa dipendenze
```bash
npm install
```

### Copia env variables
```bash
cp .env.example .env.development
# Poi completa con chiavi da Google Cloud Console
```

### Run dev server
```bash
npm run dev
# http://localhost:5173
```

---

## 🎯 FASI DI SVILUPPO

### FASE 1: Setup OAuth & Google APIs (1-2 gg)
**Go-No-Go**: OAuth setup funzionante, API keys presenti

**File da leggere**:
- REQUIREMENTS.md → Constraints (C.1)
- IMPLEMENTATION_GUIDE.md → FASE 1

**Output atteso**:
- ✅ `.env.example` aggiornato
- ✅ Google Cloud APIs abilitate
- ✅ Service account key in GCP Secret Manager
- ✅ Firestore rules deployed

---

### FASE 2: Schema Firestore (1 gg)
**Go-No-Go**: Schema validato, Firestore indexes deployati

**File da leggere**:
- IMPLEMENTATION_GUIDE.md → FASE 2
- docs/MEDIA_SCHEMA.md (crea)

**Output atteso**:
- ✅ `src/models/media.py` con Pydantic schemas
- ✅ Firestore collection structure documentata
- ✅ Indexes deployed

---

### FASE 3: Frontend Components (3-4 gg)
**Go-No-Go**: Gallery renders, localStorage cache works, no console errors

**File da leggere**:
- IMPLEMENTATION_GUIDE.md → FASE 3
- TEST_SPEC.md → Frontend tests

**Output atteso**:
- ✅ MediaContext + cache localStorage
- ✅ MediaCard, MediaGallery, MediaUploader components
- ✅ `/media` route visible in app
- ✅ Unit tests > 80% coverage
- ✅ `npm run build` succeeds

---

### FASE 4: Backend Integration (3-4 gg)
**Go-No-Go**: API endpoints functional, Firestore records created, audit trail logged

**File da leggere**:
- IMPLEMENTATION_GUIDE.md → FASE 4
- TEST_SPEC.md → Backend tests

**Output atteso**:
- ✅ `src/routes/media.py` con 6 endpoints
- ✅ Google Drive API integration working
- ✅ Firestore CRUD operations
- ✅ Audit logging
- ✅ Integration tests pass

---

### FASE 5: Testing & Deployment (2-3 gg)
**Go-No-Go**: All tests pass, zero console errors, deployment successful

**File da leggere**:
- TEST_SPEC.md (completo)
- EXPERIMENTAL_INTEGRATION.md

**Output atteso**:
- ✅ Test coverage > 85%
- ✅ E2E tests pass
- ✅ Staging deployment successful
- ✅ Prod deployment with feature flag
- ✅ Monitoring configured

---

## 🔄 FLOW DETERMINISTICO

```
Leggi GEMINI_PROMPT.md
        ↓
Leggi REQUIREMENTS.md (requisiti finali)
        ↓
FASE 1: Google Setup
├─ Leggi IMPLEMENTATION_GUIDE.md FASE 1
├─ Segui step-by-step
├─ Commit su branch feature/media-phase-1
├─ Check: .env aggiornato, rules deployed
        ↓
FASE 2: Schema
├─ Leggi IMPLEMENTATION_GUIDE.md FASE 2
├─ Crea src/models/media.py
├─ Deploy firestore.indexes.json
        ↓
FASE 3: Frontend
├─ Leggi IMPLEMENTATION_GUIDE.md FASE 3
├─ Crea componenti (MediaContext, MediaCard, etc)
├─ Leggi TEST_SPEC.md → scrivi unit tests
├─ npm run test, npm run build
├─ Commit feature/media-phase-3
        ↓
FASE 4: Backend
├─ Leggi IMPLEMENTATION_GUIDE.md FASE 4
├─ Crea src/routes/media.py
├─ Crea src/services/media_service.py
├─ Leggi TEST_SPEC.md → scrivi integration tests
├─ pytest tests/test_media*
├─ Commit feature/media-phase-4
        ↓
FASE 5: Testing & Deploy
├─ Leggi TEST_SPEC.md (completo)
├─ Esegui tutti tests
├─ Leggi EXPERIMENTAL_INTEGRATION.md
├─ Setup feature flag
├─ Merge su main
├─ Deploy staging → prod
└─ Monitor metrics
```

---

## 📊 CHECKLIST GIORNALIERA

**Ogni mattina**:
- [ ] Leggi il prompt rilevante per la fase corrente
- [ ] Capti i requirements (non improvvisare)
- [ ] Scrivi codice minimale per step specifico
- [ ] Testa (unit + integration)
- [ ] Commit con messaggio descrittivo
- [ ] Aggiorna progresso in memoria/tasklist

**Ogni serata**:
- [ ] Verifica test passing
- [ ] Build successful
- [ ] Documenta blocchi
- [ ] Prepara step successivo

---

## 🚨 VINCOLI IMPORTANTI

1. **NODE_ENV**: `npm install --include=dev` (non dev dependencies non installano)
2. **GitHub**: No MCP connector → usare Desktop Commander per validation
3. **GCloud**: Non appesantire — media personali su Drive user, collettivi su Drive Fontanin
4. **Multilingua**: i18next keys (it/en/ar/pt/es/hi/ur/ne)
5. **RTL**: Verificare layout per ar/ur/ne

**Leggi REQUIREMENTS.md Constraints** per dettagli.

---

## 🎁 COME USARE QUESTI FILE

### Scenario 1: Iniziare Fase 1
```
1. Apri GEMINI_PROMPT.md → leggi overview
2. Apri IMPLEMENTATION_GUIDE.md → scroll a "FASE 1"
3. Segui step-by-step
4. Quando finito → Fase 2
```

### Scenario 2: Dubbio su Requisito
```
1. Apri REQUIREMENTS.md
2. Cerca la sezione rilevante (RF, RNF, Constraints, AC)
3. Trovi la risposta
```

### Scenario 3: Come Testare
```
1. Apri TEST_SPEC.md
2. Leggi section per componente che stai testando
3. Copia test file template
4. Adatta al tuo codice
```

### Scenario 4: Feature Flag
```
1. Apri EXPERIMENTAL_INTEGRATION.md
2. Segui setup
3. Imposta rollout % in featureFlags.js
```

---

## 🎓 METODOLOGIA ACCENTURE

Questi file seguono principi **sistemici** e **deterministici**:

- ✅ **Sistemico**: Architettura completa, componenti chiari, dependencies mappate
- ✅ **Deterministico**: 5 fasi sequenziali, step concreti, file identificati
- ✅ **Non ambiguo**: Requirements formali, acceptance criteria specifici
- ✅ **Testabile**: Test specs dettagliate per ogni componente
- ✅ **Tracciabile**: Commit message, changelog, audit trail

**Non lasciare spazio a interpretazione** — segui i file step-by-step.

---

## 📞 DOMANDE FREQUENTI

### Q: Posso saltare una fase?
**A**: No. Ogni fase dipende dalla precedente. Fase 3 (Frontend) dipende da Fase 2 (Schema).

### Q: Cosa faccio se blocco?
**A**: 
1. Leggi la sezione rilevante in REQUIREMENTS.md
2. Leggi IMPLEMENTATION_GUIDE.md per quella fase
3. Se ancora bloccato → documenta e escalate (non improvvisare)

### Q: I test passano ma il codice non funziona?
**A**: Tests incompleti. Leggi TEST_SPEC.md per coverage richiesto (>85%).

### Q: Quando rimuovo il feature flag?
**A**: Dopo 4 settimane di production con error rate < 1% e user satisfaction > 80%. Leggi EXPERIMENTAL_INTEGRATION.md → Stability Phase.

### Q: Come rollback se c'è bug?
**A**: EXPERIMENTAL_INTEGRATION.md → Rollback Plan. Dipende dalla severità.

---

## ✅ DEFINIZIONE DI DONE

**Una fase è "done" quando:**

1. Tutti file creati/modificati
2. Codice review passed (self-review)
3. Tutti test passing (unit + integration + e2e)
4. `npm run build` succeeds
5. Zero console errors (dev + staging)
6. Commit message descriptivo
7. Documentazione aggiornata

**Poi**: Go to next phase.

---

## 📚 DOCUMENTAZIONE

Leggi questi per contesto:
- Project: [Il Fontanin on Vercel](https://il-fontanin.vercel.app)
- GCP Project: `freedomrun-491323`
- Stack: React 18 + Firebase/Firestore + Vite + i18next
- Owner: Daniel Giardina (daniel.giardina@gmail.com)

---

## 🎬 INIZIA ORA

**Step 1**: Apri `GEMINI_PROMPT.md`  
**Step 2**: Leggi overview + architettura  
**Step 3**: Inizia FASE 1 seguendo `IMPLEMENTATION_GUIDE.md`  

**Good luck! 🚀**
