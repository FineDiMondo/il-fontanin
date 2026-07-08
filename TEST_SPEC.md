# TEST SPECIFICATIONS - SEZIONE MEDIA

## UNIT TESTS

### Frontend Components

#### MediaCard.test.jsx
```javascript
import { render, screen } from '@testing-library/react'
import MediaCard from '../MediaCard'

describe('MediaCard', () => {
  const mockMedia = {
    id: 'media123',
    name: 'Test Photo.jpg',
    mime_type: 'image/jpeg',
    visibility: 'public',
    owner_id: 'user456',
    size_bytes: 2048000,
    created_at: '2024-06-15T10:00:00Z'
  }

  it('renders media name', () => {
    render(<MediaCard media={mockMedia} onDelete={() => {}} />)
    expect(screen.getByText('Test Photo.jpg')).toBeInTheDocument()
  })

  it('shows visibility badge for public', () => {
    render(<MediaCard media={mockMedia} onDelete={() => {}} />)
    expect(screen.getByText('🌍')).toBeInTheDocument()
  })

  it('shows delete button for owner', () => {
    // Mock useAuth to return current user as owner
    const { getByText } = render(<MediaCard media={mockMedia} onDelete={() => {}} />)
    expect(getByText('Elimina')).toBeInTheDocument()
  })

  it('does not show delete button for non-owner', () => {
    // Mock useAuth to return different user
    const { queryByText } = render(<MediaCard media={mockMedia} onDelete={() => {}} />)
    expect(queryByText('Elimina')).not.toBeInTheDocument()
  })
})
```

#### MediaGallery.test.jsx
```javascript
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MediaGallery from '../MediaGallery'
import { MediaProvider } from '../../context/MediaContext'

describe('MediaGallery', () => {
  it('renders gallery with 10 items', () => {
    const mockMedia = Array(10).fill(null).map((_, i) => ({
      id: `media${i}`,
      name: `Photo${i}.jpg`,
      visibility: 'public'
    }))
    
    render(
      <MediaProvider initialData={mockMedia}>
        <MediaGallery />
      </MediaProvider>
    )
    
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(10)
  })

  it('filters by visibility: public only', async () => {
    const user = userEvent.setup()
    render(<MediaGallery />)
    
    const filterButton = screen.getByRole('button', { name: /Pubblici/i })
    await user.click(filterButton)
    
    // Verify only public items shown
    const cards = screen.getAllByRole('article')
    cards.forEach(card => {
      expect(within(card).getByText('🌍')).toBeInTheDocument()
    })
  })

  it('lazy loads thumbnails on scroll', async () => {
    render(<MediaGallery />)
    
    const images = screen.getAllByRole('img')
    images.forEach(img => {
      expect(img).toHaveAttribute('loading', 'lazy')
    })
  })

  it('paginates results (limit 50)', () => {
    // Mock 100 items
    render(<MediaGallery />)
    
    const visibleCards = screen.getAllByRole('article')
    expect(visibleCards.length).toBeLessThanOrEqual(50)
    
    const nextButton = screen.getByRole('button', { name: /Prossima/i })
    expect(nextButton).toBeInTheDocument()
  })
})
```

#### MediaUploader.test.jsx
```javascript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MediaUploader from '../MediaUploader'

describe('MediaUploader', () => {
  it('renders file input', () => {
    render(<MediaUploader onUploadSuccess={() => {}} />)
    const input = screen.getByRole('button', { name: /Carica file/i })
    expect(input).toBeInTheDocument()
  })

  it('accepts image/video/audio files only', async () => {
    const { getByTestId } = render(<MediaUploader onUploadSuccess={() => {}} />)
    const input = getByTestId('file-input')
    
    expect(input).toHaveAttribute('accept', 'image/*,video/*,audio/*')
  })

  it('validates file size < 500MB', async () => {
    const user = userEvent.setup()
    render(<MediaUploader onUploadSuccess={() => {}} />)
    
    const largeFile = new File(['x'.repeat(600 * 1024 * 1024)], 'large.iso')
    const input = screen.getByTestId('file-input')
    
    await user.upload(input, largeFile)
    const error = await screen.findByText(/troppo grande/i)
    expect(error).toBeInTheDocument()
  })

  it('shows visibility selector', () => {
    render(<MediaUploader onUploadSuccess={() => {}} />)
    const selector = screen.getByRole('combobox')
    expect(selector).toHaveOption('Pubblico')
    expect(selector).toHaveOption('Solo community')
  })
})
```

#### MediaContext.test.jsx
```javascript
import { renderHook, act } from '@testing-library/react'
import { MediaProvider, useMedia } from '../../context/MediaContext'

describe('MediaContext', () => {
  it('loads media from cache on mount', () => {
    const cachedData = [{ id: '1', name: 'Photo.jpg' }]
    localStorage.setItem('media_cache', JSON.stringify(cachedData))
    
    const wrapper = ({ children }) => <MediaProvider>{children}</MediaProvider>
    const { result } = renderHook(() => useMedia(), { wrapper })
    
    expect(result.current.media).toEqual(cachedData)
  })

  it('updates cache when filtering', async () => {
    const wrapper = ({ children }) => <MediaProvider>{children}</MediaProvider>
    const { result } = renderHook(() => useMedia(), { wrapper })
    
    await act(async () => {
      result.current.setFilters({ visibility: 'public' })
    })
    
    const cached = JSON.parse(localStorage.getItem('media_cache'))
    expect(cached).toBeDefined()
  })

  it('invalidates cache on delete', async () => {
    localStorage.setItem('media_cache', JSON.stringify([{ id: '1' }]))
    
    const wrapper = ({ children }) => <MediaProvider>{children}</MediaProvider>
    const { result } = renderHook(() => useMedia(), { wrapper })
    
    await act(async () => {
      await result.current.deleteMedia('1')
    })
    
    const cached = localStorage.getItem('media_cache')
    expect(cached).toBeNull()
  })
})
```

### Backend Services

#### test_media_service.py
```python
import pytest
from src.services.media_service import MediaService
from datetime import datetime

@pytest.fixture
def media_service():
    return MediaService()

def test_create_personal_link(media_service):
    media_id = media_service.create_personal_link(
        community_id='fontanin-main',
        owner_id='user123',
        drive_file_id='1A2B3C4D',
        name='Photo.jpg',
        mime_type='image/jpeg',
        size_bytes=2048000,
        visibility='public'
    )
    
    assert media_id is not None
    media = media_service.get_media('fontanin-main', media_id)
    assert media.type == 'personal_link'
    assert media.name == 'Photo.jpg'

def test_query_media_with_visibility_filter(media_service):
    # Create test data
    media_service.create_personal_link(
        community_id='fontanin-main',
        owner_id='user123',
        drive_file_id='1A2B',
        name='Public.jpg',
        mime_type='image/jpeg',
        size_bytes=1000,
        visibility='public'
    )
    
    media_service.create_personal_link(
        community_id='fontanin-main',
        owner_id='user123',
        drive_file_id='2B3C',
        name='Private.jpg',
        mime_type='image/jpeg',
        size_bytes=1000,
        visibility='private'
    )
    
    # Query
    public_only = media_service.query_media(
        community_id='fontanin-main',
        visibility='public'
    )
    
    assert len(public_only) == 1
    assert public_only[0]['visibility'] == 'public'

def test_delete_media_soft_delete(media_service):
    media_id = media_service.create_personal_link(
        community_id='fontanin-main',
        owner_id='user123',
        drive_file_id='1A2B3C4D',
        name='Photo.jpg',
        mime_type='image/jpeg',
        size_bytes=2048000,
        visibility='public'
    )
    
    media_service.delete_media(
        community_id='fontanin-main',
        media_id=media_id,
        deleted_by='user123',
        reason='Accidental upload'
    )
    
    media = media_service.get_media('fontanin-main', media_id)
    assert media.status == 'deleted'
    assert media.deleted_by == 'user123'
```

#### test_google_drive_service.py
```python
import pytest
from unittest.mock import Mock, patch
from src.services.google_drive_service import GoogleDriveService

@pytest.fixture
def drive_service():
    with patch('src.services.google_drive_service.build'):
        return GoogleDriveService()

def test_get_file_metadata(drive_service):
    drive_service.service.files().get.return_value.execute.return_value = {
        'id': '1A2B3C4D',
        'name': 'Photo.jpg',
        'mimeType': 'image/jpeg',
        'size': '2048000'
    }
    
    metadata = drive_service.get_file_metadata('1A2B3C4D')
    
    assert metadata['name'] == 'Photo.jpg'
    assert metadata['mimeType'] == 'image/jpeg'

def test_get_file_metadata_not_found(drive_service):
    drive_service.service.files().get.return_value.execute.side_effect = Exception('Not found')
    
    with pytest.raises(ValueError, match='File not found'):
        drive_service.get_file_metadata('invalid_id')

def test_create_shared_link(drive_service):
    drive_service.service.permissions().create.return_value.execute.return_value = {}
    
    link = drive_service.create_shared_link('1A2B3C4D')
    
    assert 'drive.google.com' in link
    assert '1A2B3C4D' in link
```

---

## INTEGRATION TESTS

### End-to-End API Tests

#### test_media_endpoints.py
```python
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

@pytest.fixture
def auth_headers():
    # Mock JWT token for test user
    return {"Authorization": "Bearer test_token_123"}

def test_list_media_empty(auth_headers):
    response = client.get("/media", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []

def test_link_personal_media_success(auth_headers, mocker):
    # Mock Google Drive API
    mocker.patch(
        'src.services.google_drive_service.GoogleDriveService.get_file_metadata',
        return_value={'name': 'Photo.jpg', 'mimeType': 'image/jpeg', 'size': '2048000'}
    )
    
    response = client.post(
        "/media/link-personal",
        headers=auth_headers,
        json={
            "drive_file_id": "1A2B3C4D",
            "name": "Photo.jpg",
            "mime_type": "image/jpeg",
            "visibility": "public"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['type'] == 'personal_link'
    assert data['status'] == 'created'

def test_link_personal_media_invalid_file(auth_headers, mocker):
    mocker.patch(
        'src.services.google_drive_service.GoogleDriveService.get_file_metadata',
        side_effect=Exception('File not found')
    )
    
    response = client.post(
        "/media/link-personal",
        headers=auth_headers,
        json={"drive_file_id": "invalid"}
    )
    
    assert response.status_code == 400

def test_upload_media_success(auth_headers, mocker):
    mocker.patch(
        'src.services.google_drive_service.GoogleDriveService.upload_file_to_fontanin_drive',
        return_value='2B3C4D5E'
    )
    
    response = client.post(
        "/media/upload",
        headers=auth_headers,
        data={"visibility": "public"},
        files={"file": ("test.jpg", b"fake image data", "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['type'] == 'collective_upload'

def test_upload_media_file_too_large(auth_headers):
    large_data = b"x" * (600 * 1024 * 1024)  # 600MB
    
    response = client.post(
        "/media/upload",
        headers=auth_headers,
        files={"file": ("large.iso", large_data)}
    )
    
    assert response.status_code == 413

def test_upload_media_invalid_mime_type(auth_headers):
    response = client.post(
        "/media/upload",
        headers=auth_headers,
        files={"file": ("test.exe", b"malware", "application/exe")}
    )
    
    assert response.status_code == 415

def test_delete_media_as_owner(auth_headers, mocker):
    # Create media first
    mocker.patch(
        'src.services.google_drive_service.GoogleDriveService.get_file_metadata',
        return_value={'name': 'Photo.jpg', 'mimeType': 'image/jpeg', 'size': '2048000'}
    )
    
    create_resp = client.post(
        "/media/link-personal",
        headers=auth_headers,
        json={"drive_file_id": "1A2B", "name": "Photo.jpg", "mime_type": "image/jpeg"}
    )
    media_id = create_resp.json()['id']
    
    # Delete
    response = client.delete(
        f"/media/{media_id}",
        headers=auth_headers,
        json={"reason": "Accidental upload"}
    )
    
    assert response.status_code == 200
    assert response.json()['status'] == 'deleted'

def test_delete_media_unauthorized(auth_headers, mocker):
    # Try to delete as non-owner
    response = client.delete(
        "/media/other_user_media",
        headers=auth_headers,
        json={"reason": "Not my media"}
    )
    
    assert response.status_code == 403

def test_download_media_with_audit_log(auth_headers, mocker):
    mocker.patch(
        'src.services.google_drive_service.GoogleDriveService.download_file',
        return_value=b"image data"
    )
    
    response = client.get(
        "/media/media123/download",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    # Verify audit log entry created
    # (check Firestore or mock verification)

def test_moderation_list_admin_only(auth_headers, mocker):
    # Non-admin user
    response = client.get("/media/moderation/list", headers=auth_headers)
    assert response.status_code == 403
    
    # Admin user
    admin_headers = {"Authorization": "Bearer admin_token"}
    response = client.get("/media/moderation/list", headers=admin_headers)
    assert response.status_code == 200
```

---

## E2E TESTS

### Playwright Tests

#### e2e_media_flow.test.js
```javascript
import { test, expect } from '@playwright/test'

test.describe('Media Feature E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForNavigation()
    
    // Navigate to media
    await page.goto('http://localhost:5173/media')
  })

  test('gallery loads and displays media', async ({ page }) => {
    // Wait for gallery to load
    await page.waitForSelector('[data-testid="media-gallery"]')
    
    const cards = await page.locator('[data-testid="media-card"]')
    expect(cards).toHaveCount(10)
  })

  test('link personal media from Google Drive', async ({ page }) => {
    // Click "Apri Google Picker"
    await page.click('[data-testid="open-picker-button"]')
    
    // Wait for Google Picker popup (in real scenario)
    // For testing: mock Google Picker
    await page.evaluate(() => {
      window.mockGooglePickerResponse({
        id: '1A2B3C4D',
        name: 'Photo.jpg',
        mimeType: 'image/jpeg'
      })
    })
    
    // Verify file appears in gallery
    await expect(page.locator('text=Photo.jpg')).toBeVisible()
  })

  test('upload file to Fontanin Drive', async ({ page }) => {
    // Fill form
    await page.fill('[data-testid="description-input"]', 'Event photo')
    await page.selectOption('[data-testid="visibility-select"]', 'public')
    
    // Upload file
    await page.setInputFiles('[data-testid="file-input"]', 'tests/fixtures/test.jpg')
    await page.click('[data-testid="upload-button"]')
    
    // Wait for upload to complete
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 5000 })
    
    // Verify file in gallery
    await expect(page.locator('text=Event photo')).toBeVisible()
  })

  test('delete media as owner', async ({ page }) => {
    // Find delete button
    const firstCard = page.locator('[data-testid="media-card"]').first()
    await firstCard.hover()
    
    const deleteButton = firstCard.locator('[data-testid="delete-button"]')
    await deleteButton.click()
    
    // Confirm delete
    await page.click('[data-testid="confirm-delete"]')
    
    // Verify media removed
    await expect(firstCard).not.toBeVisible()
  })

  test('filter by visibility', async ({ page }) => {
    // Click "Pubblici" filter
    await page.click('[data-testid="visibility-filter-public"]')
    
    // Wait for filter
    await page.waitForTimeout(500)
    
    // Verify all visible cards are public
    const cards = await page.locator('[data-testid="media-card"]')
    const count = await cards.count()
    
    for (let i = 0; i < count; i++) {
      const badge = cards.nth(i).locator('[data-testid="visibility-badge"]')
      await expect(badge).toContainText('🌍')
    }
  })

  test('pagination works', async ({ page }) => {
    // Check if next button exists
    const nextButton = page.locator('[data-testid="pagination-next"]')
    
    if (await nextButton.isVisible()) {
      await nextButton.click()
      
      // Wait for new page
      await page.waitForTimeout(500)
      
      // Verify new items loaded
      const cards = await page.locator('[data-testid="media-card"]')
      expect(cards).toBeDefined()
    }
  })
})
```

---

## PERFORMANCE TESTS

### Lighthouse Tests
```bash
# Run Lighthouse on /media page
npm run lighthouse -- http://localhost:5173/media

# Expected results:
# - First Contentful Paint: < 2s
# - Largest Contentful Paint: < 2.5s
# - Cumulative Layout Shift: < 0.1
# - Time to Interactive: < 3.5s
```

### Load Tests
```bash
# k6 load test (simulate 100 users)
k6 run tests/load/media_load_test.js

# Expected:
# - API response time p95: < 1s
# - Error rate: < 1%
```

---

## TEST COVERAGE TARGETS

| Component | Target | Current |
|-----------|--------|---------|
| MediaCard.jsx | 85% | - |
| MediaGallery.jsx | 80% | - |
| MediaUploader.jsx | 85% | - |
| MediaContext.jsx | 90% | - |
| media_service.py | 90% | - |
| google_drive_service.py | 85% | - |
| media.py (routes) | 80% | - |
| **Overall** | **85%** | - |

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/test-media.yml`

```yaml
name: Media Feature Tests

on:
  push:
    paths:
      - 'src/**/*media*'
      - 'tests/**/*media*'
  pull_request:

jobs:
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run test -- --coverage src/components/Media*.jsx
      - run: npm run lint src/components/Media*.jsx
      - run: npm run build

  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest tests/test_media* --cov=src/services --cov=src/routes
      - run: flake8 src/services/media* src/routes/media.py

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install
      - run: npm run dev &
      - run: npx playwright test tests/e2e/media*
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## TEST EXECUTION CHECKLIST

- [ ] All unit tests passing: `npm run test`
- [ ] All backend tests passing: `pytest tests/`
- [ ] Code coverage > 85%: `npm run test -- --coverage`
- [ ] E2E tests passing: `npx playwright test`
- [ ] No lint errors: `npm run lint`
- [ ] No TS errors: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] Performance acceptable: Lighthouse score > 80
- [ ] Accessibility check: axe-core no violations
- [ ] Security audit: `npm audit`, `pip audit`
