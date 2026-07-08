# INTEGRAZIONE MEDIA IN "ESPERIMENTI ATTIVI"

## OVERVIEW

La sezione **Media** deve vivere sotto **ESPERIMENTI ATTIVI** come feature flag sperimentale, finché non è completamente stabile.

### Flusso
```
App.jsx
  ↓
ExperimentalSection.jsx
  ↓
  ├─ Feature Flag: media_feature_enabled
  │
  └─ if (enabled):
      ↓
      Media/
        ├─ MediaGallery.jsx
        ├─ MediaUploader.jsx
        └─ ...
```

---

## IMPLEMENTAZIONE

### 1. Feature Flag Setup

**File da creare**: `src/lib/featureFlags.js`

```javascript
// Feature flags configuration
export const FEATURE_FLAGS = {
  MEDIA_PERSONAL_PHOTOS: {
    name: 'media_personal_photos',
    label: 'Personal Media Upload',
    description: 'Link photos/videos from Google Drive',
    enabled: import.meta.env.VITE_ENABLE_MEDIA_FEATURE === 'true',
    rolloutPercentage: 100 // 0-100, gradual rollout
  },
  MEDIA_COMMUNITY_LIBRARY: {
    name: 'media_community_library',
    label: 'Community Media Library',
    description: 'Upload media to shared Fontanin Drive',
    enabled: import.meta.env.VITE_ENABLE_MEDIA_FEATURE === 'true',
    rolloutPercentage: 100
  }
}

export function isFeatureEnabled(flagName, userId) {
  const flag = FEATURE_FLAGS[flagName]
  if (!flag) return false
  
  if (!flag.enabled) return false
  
  // Gradual rollout: hash user ID to determine if included
  if (flag.rolloutPercentage < 100) {
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return (hash % 100) < flag.rolloutPercentage
  }
  
  return true
}
```

### 2. Environment Variables

**File**: `.env.example` (aggiungi)

```bash
# Feature Flags
VITE_ENABLE_MEDIA_FEATURE=true    # Enable Media in ESPERIMENTI ATTIVI
```

**File**: `.env.development`

```bash
VITE_ENABLE_MEDIA_FEATURE=true
```

**File**: `.env.production`

```bash
# Per produzione, decidere se abilitare gradualmente
VITE_ENABLE_MEDIA_FEATURE=false   # oppure true dopo stabilizzazione
```

---

### 3. ExperimentalSection Component

**File da creare**: `src/pages/ExperimentalSection.jsx`

```javascript
import { useAuth } from '../context/AuthContext'
import { isFeatureEnabled, FEATURE_FLAGS } from '../lib/featureFlags'
import Media from './Media'

export default function ExperimentalSection() {
  const { user } = useAuth()
  
  const isMediaEnabled = isFeatureEnabled('MEDIA_PERSONAL_PHOTOS', user?.id)

  return (
    <div className="experimental-section">
      <header className="px-4 py-4">
        <h2 className="text-lg font-bold text-stone-800">🧪 ESPERIMENTI ATTIVI</h2>
        <p className="text-xs text-stone-500 mt-1">
          Funzioni in fase sperimentale. Feedback benvenuto!
        </p>
      </header>

      {/* Media Feature */}
      {isMediaEnabled ? (
        <div className="px-4 py-4 border-t border-stone-200">
          <div className="badge-experimental mb-3">
            <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              BETA
            </span>
          </div>
          <Media experimental={true} />
        </div>
      ) : (
        <div className="px-4 py-12 text-center">
          <div className="text-stone-400 text-lg mb-2">💧</div>
          <p className="text-sm text-stone-600">Nessun esperimento attivo</p>
          <p className="text-xs text-stone-400 mt-1">Torna più tardi</p>
        </div>
      )}

      {/* Feedback Widget */}
      <div className="px-4 py-4 border-t border-stone-200 bg-stone-50 rounded-lg mx-4 mb-4">
        <p className="text-xs text-stone-600 font-medium">Hai feedback?</p>
        <a
          href="mailto:feedback@el-fontanin.it?subject=Esperimento: Media"
          className="text-xs text-oro-muted hover:text-oro underline mt-1 block"
        >
          Scrivi feedback
        </a>
      </div>
    </div>
  )
}
```

### 4. Update Media.jsx to Accept Experimental Flag

**File da modificare**: `src/pages/Media.jsx`

```javascript
export default function Media({ experimental = false }) {
  // ... existing code ...

  return (
    <div className="app-shell">
      {experimental && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-2 text-[11px] text-amber-800">
          ⚠️ Questa è una funzione sperimentale. Alcuni contenuti potrebbero scomparire o cambiare.
        </div>
      )}
      
      <AppHeader title={t('media.title')} showBack={false} />
      
      {/* ... rest of Media page ... */}
    </div>
  )
}
```

### 5. Add Experimental Section to Navigation

**File da modificare**: `src/components/BottomNav.jsx`

```javascript
export default function BottomNav() {
  const isAdmin = useAuth().user?.ruolo === 'admin'

  return (
    <nav className="bottom-nav">
      <NavLink to="/">Home</NavLink>
      <NavLink to="/forum">Forum</NavLink>
      <NavLink to="/chat">Chat</NavLink>
      <NavLink to="/eventi">Eventi</NavLink>
      {/* Experimental Section */}
      <NavLink to="/research" data-testid="experimental-nav">
        🧪 Esperimenti
      </NavLink>
    </nav>
  )
}
```

### 6. Add Route in App.jsx

**File da modificare**: `src/App.jsx`

```javascript
import ExperimentalSection from './pages/ExperimentalSection'
import Media from './pages/Media'
import { MediaProvider } from './context/MediaContext'

function AppRoutes() {
  return (
    <Routes>
      {/* ... existing routes ... */}
      
      {/* Experimental Section */}
      <Route
        path="/research"
        element={
          <SocioRoute>
            <ExperimentalSection />
          </SocioRoute>
        }
      />
      
      {/* Direct Media Route (if not accessed via experimental) */}
      <Route
        path="/media"
        element={
          <SocioRoute>
            <MediaProvider>
              <Media experimental={false} />
            </MediaProvider>
          </SocioRoute>
        }
      />
    </Routes>
  )
}
```

---

## GRADUAL ROLLOUT STRATEGY

### Phase 1: Canary (Week 1-2)
```
VITE_ENABLE_MEDIA_FEATURE=true
rolloutPercentage=10  # Only 10% of users see feature
```
- Monitora error logs, performance metrics
- Raccolta feedback da utenti early adopters
- Check Firestore quota usage

### Phase 2: Ramp Up (Week 3-4)
```
rolloutPercentage=50  # 50% di utenti
```
- Verifica no regressions
- Performance stable
- User feedback positive

### Phase 3: Full Rollout (Week 5+)
```
rolloutPercentage=100  # Tutti gli utenti
VITE_ENABLE_MEDIA_FEATURE=true  # Production
```
- Feature diventa stable
- Rimuovi "BETA" badge
- Sposta out of ESPERIMENTI ATTIVI (opzionale)

---

## MONITORING & TELEMETRY

### Events to Track

**File da creare**: `src/lib/eventTracking.js`

```javascript
import * as Sentry from "@sentry/react"

export function trackMediaEvent(action, properties = {}) {
  Sentry.captureMessage(`Media: ${action}`, 'info', {
    extra: {
      action,
      timestamp: new Date().toISOString(),
      ...properties
    },
    tags: {
      feature: 'media_experimental',
      section: 'experimental'
    }
  })
}

// Usage:
// trackMediaEvent('media_link_started', { mime_type: 'image/jpeg' })
// trackMediaEvent('media_upload_completed', { size_mb: 5 })
// trackMediaEvent('media_upload_failed', { error: 'file too large' })
// trackMediaEvent('media_delete_initiated')
```

### Dashboards to Create

**Sentry Dashboard** (Analytics):
- [ ] Media feature usage: DAU/WAU
- [ ] Upload success rate (%)
- [ ] Error rate by operation
- [ ] API response times
- [ ] Firestore quota usage

**Google Analytics**:
- [ ] Page views: /research (Experimental Section)
- [ ] Events: media_link, media_upload, media_delete
- [ ] User cohorts: early adopters

---

## ROLLBACK PLAN

### If Critical Issues Found

**Option 1: Disable Feature**
```bash
# Update .env.production
VITE_ENABLE_MEDIA_FEATURE=false

# Redeploy frontend
npm run build && firebase deploy --only hosting --project el-fontanin
```

**Option 2: Gradual Disable**
```javascript
// In featureFlags.js
rolloutPercentage=5  # Drop to 5% of users
```

**Option 3: Full Revert**
```bash
git revert <commit-with-media-feature>
git push
npm run build && firebase deploy --only hosting --project el-fontanin
```

---

## FEATURE FLAG REMOVAL (After Stable)

### Quando Media è Stabile (Production)

1. Rimuovi feature flag:
   ```javascript
   // featureFlags.js
   delete FEATURE_FLAGS.MEDIA_PERSONAL_PHOTOS
   ```

2. Semplifica condition in ExperimentalSection:
   ```javascript
   // Media non più under experimental flag
   // Sposta alla navigazione principale
   ```

3. Puoi:
   - [ ] Spostare Media fuori da ESPERIMENTI ATTIVI
   - [ ] Aggiungere link permanente in BottomNav
   - [ ] Rimuovere BETA badge

---

## TESTING CON FEATURE FLAGS

### Unit Test

```javascript
import { isFeatureEnabled, FEATURE_FLAGS } from '../lib/featureFlags'

describe('Feature Flags', () => {
  it('returns false when feature disabled', () => {
    const originalEnv = import.meta.env.VITE_ENABLE_MEDIA_FEATURE
    import.meta.env.VITE_ENABLE_MEDIA_FEATURE = 'false'
    
    expect(isFeatureEnabled('MEDIA_PERSONAL_PHOTOS', 'user123')).toBe(false)
    
    import.meta.env.VITE_ENABLE_MEDIA_FEATURE = originalEnv
  })

  it('respects rollout percentage', () => {
    const users = Array(100).fill(null).map((_, i) => `user${i}`)
    const enabled = users.filter(u => isFeatureEnabled('MEDIA_PERSONAL_PHOTOS', u))
    
    // With 50% rollout, expect ~50 users (±10%)
    expect(enabled.length).toBeGreaterThan(40)
    expect(enabled.length).toBeLessThan(60)
  })
})
```

### E2E Test

```javascript
test('experimental media not shown when disabled', async ({ page }) => {
  // Set env to disable
  await page.evaluate(() => {
    window.localStorage.setItem('VITE_ENABLE_MEDIA_FEATURE', 'false')
  })
  
  await page.goto('http://localhost:5173/research')
  
  // Should see "Nessun esperimento attivo"
  await expect(page.locator('text=Nessun esperimento')).toBeVisible()
  
  // Media section not rendered
  await expect(page.locator('[data-testid="media-gallery"]')).not.toBeVisible()
})
```

---

## FEEDBACK LOOP

### How Users Report Issues

1. **In-app feedback button**:
   ```
   🧪 ESPERIMENTI ATTIVI
   [Hai feedback?] → Email
   ```

2. **Community Slack channel**:
   - `#media-experimental` — dedicated channel
   - Daily digest of issues

3. **Feedback Form**:
   - Link: `/feedback?experiment=media`
   - Fields: issue, severity, reproduction steps

### Weekly Review

**Triage checklist**:
- [ ] Raccogli feedback utenti
- [ ] Analizza error logs
- [ ] Verifica metrics (DAU, error rate)
- [ ] Decidi: Continue / Adjust / Rollback
- [ ] Communicate status in community

---

## CHECKLIST

### Setup Phase
- [ ] Feature flags file created (`featureFlags.js`)
- [ ] `.env.example` updated with `VITE_ENABLE_MEDIA_FEATURE`
- [ ] ExperimentalSection component created
- [ ] Routes updated (`/research` route added)
- [ ] BottomNav includes "🧪 Esperimenti" link

### Deployment Phase
- [ ] Build succeeds with feature flag enabled
- [ ] Staging deployment tests ExperimentalSection visible
- [ ] Prod deployment with `VITE_ENABLE_MEDIA_FEATURE=true`
- [ ] Monitoring configured (Sentry dashboard)
- [ ] Feedback email configured

### Rollout Phase
- [ ] Week 1-2: Canary (10% users)
  - [ ] Monitor error logs
  - [ ] Verify no performance regression
  - [ ] Collect user feedback
- [ ] Week 3-4: Ramp (50% users)
  - [ ] Check all systems stable
  - [ ] Increase to 100% if ready
- [ ] Week 5+: Full rollout (100% users)
  - [ ] Remove BETA badge (optional)
  - [ ] Plan removal of feature flag

### Stability Phase
- [ ] After 4 weeks: Evaluate for stable release
  - [ ] Error rate < 1%
  - [ ] User satisfaction > 80%
  - [ ] Performance metrics acceptable
- [ ] Remove feature flag if stable
- [ ] Move Media to main navigation
