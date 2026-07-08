# Deploy applicativo — backend Cloud Run e frontend Firebase

**Vincolo operativo:** ogni deploy richiede autorizzazione esplicita di Daniel
nella sessione corrente, come previsto da `AGENTS.md` R3. I comandi sotto sono
runbook, non autorizzazioni permanenti.

## Stage remoti

Il flusso di promozione segue tre stage remoti:

| Stage | Branch / trigger | Cloud Run | Firebase Hosting |
|---|---|---|---|
| `develop` | push su `develop` | `finedimondo-backend-develop` | preview channel `develop` |
| `certification` | push su `certification` o dispatch manuale | `finedimondo-backend-certification` | preview channel `certification` |
| `production` | tag release `v*.*.*` + approvazione umana | `finedimondo-backend` | canale live `el-fontanin.web.app` |

La promozione è: feature/work-order → `develop` → `certification` →
`production`. Produzione richiede sempre approvazione esplicita nella sessione
corrente e l'Environment GitHub `production`.

Il catalogo completo dei link per ambiente (frontend, backend, DB, console,
workflow e secret) è in `docs/ENVIRONMENTS.md`.

## Backend Cloud Run

`cloudbuild_community.yaml` usa substitutions Cloud Build. Il default del file
punta a `develop` (`finedimondo-backend-develop`) per evitare deploy produzione
accidentali.

### Develop

PowerShell:

```powershell
$tag = git rev-parse --short HEAD
gcloud builds submit `
  --project=freedomrun-491323 `
  --config=cloudbuild_community.yaml `
  "--substitutions=_STAGE=develop,_SERVICE=finedimondo-backend-develop,_REGION=europe-west1,_IMAGE_TAG=develop-$tag,_CLOUDSQL_INSTANCE=freedomrun-491323:europe-west1:jackass-verona-develop,_DB_HOST=<develop-db-host>,_DB_PORT=5432,_DB_USER=fontanin_develop,_DB_NAME=jackass_verona_develop,_DB_PASSWORD_SECRET=JACKASS_DB_PASSWORD_DEVELOP,_GOOGLE_CLOUD_PROJECT=el-fontanin"
```

Bash:

```bash
tag="$(git rev-parse --short HEAD)"
gcloud builds submit \
  --project=freedomrun-491323 \
  --config=cloudbuild_community.yaml \
  --substitutions=_STAGE=develop,_SERVICE=finedimondo-backend-develop,_REGION=europe-west1,_IMAGE_TAG="develop-$tag",_CLOUDSQL_INSTANCE=freedomrun-491323:europe-west1:jackass-verona-develop,_DB_HOST="<develop-db-host>",_DB_PORT=5432,_DB_USER=fontanin_develop,_DB_NAME=jackass_verona_develop,_DB_PASSWORD_SECRET=JACKASS_DB_PASSWORD_DEVELOP,_GOOGLE_CLOUD_PROJECT=el-fontanin
```

### Certification

PowerShell:

```powershell
$tag = git rev-parse --short HEAD
gcloud builds submit `
  --project=freedomrun-491323 `
  --config=cloudbuild_community.yaml `
  "--substitutions=_STAGE=certification,_SERVICE=finedimondo-backend-certification,_REGION=europe-west1,_IMAGE_TAG=certification-$tag,_CLOUDSQL_INSTANCE=freedomrun-491323:europe-west1:jackass-verona-certification,_DB_HOST=<certification-db-host>,_DB_PORT=5432,_DB_USER=fontanin_certification,_DB_NAME=jackass_verona_certification,_DB_PASSWORD_SECRET=JACKASS_DB_PASSWORD_CERTIFICATION,_GOOGLE_CLOUD_PROJECT=el-fontanin"
```

Bash:

```bash
tag="$(git rev-parse --short HEAD)"
gcloud builds submit \
  --project=freedomrun-491323 \
  --config=cloudbuild_community.yaml \
  --substitutions=_STAGE=certification,_SERVICE=finedimondo-backend-certification,_REGION=europe-west1,_IMAGE_TAG="certification-$tag",_CLOUDSQL_INSTANCE=freedomrun-491323:europe-west1:jackass-verona-certification,_DB_HOST="<certification-db-host>",_DB_PORT=5432,_DB_USER=fontanin_certification,_DB_NAME=jackass_verona_certification,_DB_PASSWORD_SECRET=JACKASS_DB_PASSWORD_CERTIFICATION,_GOOGLE_CLOUD_PROJECT=el-fontanin
```

### Produzione

Usare solo dopo approvazione esplicita nella sessione corrente.

PowerShell:

```powershell
$tag = git rev-parse --short HEAD
gcloud builds submit `
  --project=freedomrun-491323 `
  --config=cloudbuild_community.yaml `
  "--substitutions=_STAGE=production,_SERVICE=finedimondo-backend,_REGION=europe-west1,_IMAGE_TAG=$tag,_CLOUDSQL_INSTANCE=freedomrun-491323:europe-west1:jackass-verona,_DB_HOST=35.241.200.140,_DB_PORT=5432,_DB_USER=jackass_admin,_DB_NAME=jackass_verona,_DB_PASSWORD_SECRET=JACKASS_DB_PASSWORD,_GOOGLE_CLOUD_PROJECT=el-fontanin"
```

Bash:

```bash
tag="$(git rev-parse --short HEAD)"
gcloud builds submit \
  --project=freedomrun-491323 \
  --config=cloudbuild_community.yaml \
  --substitutions=_STAGE=production,_SERVICE=finedimondo-backend,_REGION=europe-west1,_IMAGE_TAG="$tag",_CLOUDSQL_INSTANCE=freedomrun-491323:europe-west1:jackass-verona,_DB_HOST=35.241.200.140,_DB_PORT=5432,_DB_USER=jackass_admin,_DB_NAME=jackass_verona,_DB_PASSWORD_SECRET=JACKASS_DB_PASSWORD,_GOOGLE_CLOUD_PROJECT=el-fontanin
```

## Frontend Firebase Hosting

### Develop / Certification

I workflow GitHub usano `FirebaseExtended/action-hosting-deploy` con
`channelId` rispettivamente `develop` e `certification`.

Manuale:

```powershell
npm ci --include=dev
npm run build
firebase hosting:channel:deploy develop --project el-fontanin --expires 14d
firebase hosting:channel:deploy certification --project el-fontanin --expires 30d
```

### Production

```powershell
npm ci --include=dev
npm run build
firebase deploy --only hosting --project el-fontanin
```

## Verifiche minime post-deploy

```powershell
gcloud run services describe finedimondo-backend `
  --region=europe-west1 `
  --project=freedomrun-491323 `
  --format="value(status.latestReadyRevisionName,status.url)"

Invoke-WebRequest `
  -Uri "https://finedimondo-backend-vqytacm7la-ew.a.run.app/community/health" `
  -UseBasicParsing

Invoke-WebRequest `
  -Uri "https://el-fontanin.web.app" `
  -Method Head `
  -UseBasicParsing
```
