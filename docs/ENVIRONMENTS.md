# Environment Catalogue — develop, certification, production

**Versione:** 1.1 · **Data:** 2026-07-12 · **Owner:** Daniel Giardina

Questo catalogo segue una struttura stage-gate in stile Accenture:
`develop → certification → production`, con separazione degli ambienti,
tracciabilità dei link operativi e promozione controllata. Nessun link DB
contiene password: le credenziali passano da Secret Manager.

## 1. Governance stage-gate

| Stage | Scopo | Ingresso | Uscita | Gate umano |
|---|---|---|---|---|
| `develop` | Integrazione tecnica e test automatici | PR da branch work-order | PR verso `certification` | Review tecnica |
| `certification` | Validazione release candidate, smoke test, UAT | PR da `develop` | tag/release verso `production` | Daniel + beta tester |
| `production` | Ambiente live pubblico | tag `v*.*.*` approvato | rilascio live | Daniel, per sessione |

Regole:
- Vietato promuovere direttamente da feature branch a `production`.
- Ogni stage ha risorse dedicate o, se non ancora esistenti, una voce target
  esplicita in questo documento.
- I dati produzione non devono essere usati in `develop`/`certification`
  senza dump anonimizzato o autorizzazione esplicita.

## 2. Link comuni

| Risorsa | Link |
|---|---|
| Repository GitHub | https://github.com/FineDiMondo/il-fontanin |
| Actions GitHub | https://github.com/FineDiMondo/il-fontanin/actions |
| Branch `develop` | https://github.com/FineDiMondo/il-fontanin/tree/develop |
| Branch `certification` | https://github.com/FineDiMondo/il-fontanin/tree/certification |
| Branch `main` / production source | https://github.com/FineDiMondo/il-fontanin/tree/main |
| Cloud Build history | https://console.cloud.google.com/cloud-build/builds?project=freedomrun-491323 |
| Cloud Run services | https://console.cloud.google.com/run?project=freedomrun-491323 |
| Artifact Registry image repo | https://console.cloud.google.com/artifacts/docker/freedomrun-491323/europe-west1/finedimondo?project=freedomrun-491323 |
| Firebase project | https://console.firebase.google.com/project/el-fontanin/overview |
| Firebase Hosting | https://console.firebase.google.com/project/el-fontanin/hosting/sites |
| Secret Manager | https://console.cloud.google.com/security/secret-manager?project=freedomrun-491323 |

## 3. Variabili GitHub Environment richieste

Ogni Environment GitHub (`develop`, `certification`, `production`) deve esporre
queste variabili non segrete. Le password restano in Secret Manager e il
workflow passa solo il nome del secret.

| Variabile | Esempio develop | Esempio certification | Production attuale |
|---|---|---|---|
| `CLOUDSQL_INSTANCE` | `freedomrun-491323:europe-west1:jackass-verona-develop` | `freedomrun-491323:europe-west1:jackass-verona-certification` | `freedomrun-491323:europe-west1:jackass-verona` |
| `JACKASS_DB_HOST` | `34.77.188.122` | `35.205.224.40` | `35.241.200.140` |
| `JACKASS_DB_PORT` | `5432` | `5432` | `5432` |
| `JACKASS_DB_USER` | `jackass_admin` | `jackass_admin` | `jackass_admin` |
| `JACKASS_DB_NAME` | `jackass_verona` | `jackass_verona` | `jackass_verona` |
| `JACKASS_DB_PASSWORD_SECRET` | `JACKASS_DB_PASSWORD_DEVELOP` | `JACKASS_DB_PASSWORD_CERTIFICATION` | `JACKASS_DB_PASSWORD` |
| `GOOGLE_CLOUD_PROJECT` | `el-fontanin` | `el-fontanin` | `el-fontanin` |
| `VITE_API_BASE_URL` | `https://finedimondo-backend-develop-558649366501.europe-west1.run.app` | `https://finedimondo-backend-certification-558649366501.europe-west1.run.app` | `https://finedimondo-backend-vqytacm7la-ew.a.run.app` |

## 4. Develop

**Stato attuale:** attivo. Baseline remota creata il 2026-07-12 via Cloud
Build/GCloud e Firebase preview channel.

| Area | Link / identificatore |
|---|---|
| Branch | https://github.com/FineDiMondo/il-fontanin/tree/develop |
| Workflow | https://github.com/FineDiMondo/il-fontanin/actions/workflows/deploy-develop.yml |
| Cloud Run service | `finedimondo-backend-develop` |
| Cloud Run console | https://console.cloud.google.com/run/detail/europe-west1/finedimondo-backend-develop?project=freedomrun-491323 |
| Backend URL | https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app |
| Backend alternate URL | https://finedimondo-backend-develop-558649366501.europe-west1.run.app |
| Backend health | https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app/community/health |
| Catalogo categorie | https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app/community/catalogo/categorie |
| Firebase preview | https://el-fontanin--develop-5nnaa48o.web.app |
| Firebase channel deploy | `firebase hosting:channel:deploy develop --project el-fontanin --expires 14d` |
| Ultima revisione verificata | `finedimondo-backend-develop-00003-2tx` |
| Ultimo Cloud Build OK | `21c3c2ea-df1d-4fa3-8121-418c1fbb4ed7` |

### Develop DB

| Campo | Valore |
|---|---|
| Stato | attivo, schema applicativo creato e seed categorie allineato |
| Cloud SQL instance | `jackass-verona-develop` |
| Cloud SQL console | https://console.cloud.google.com/sql/instances/jackass-verona-develop/overview?project=freedomrun-491323 |
| Host pubblico configurato | `34.77.188.122` |
| Database applicativo configurato | `jackass_verona` |
| User applicativo configurato | `jackass_admin` |
| Secret password | https://console.cloud.google.com/security/secret-manager/secret/JACKASS_DB_PASSWORD_DEVELOP/versions?project=freedomrun-491323 |
| DSN template | `postgresql://jackass_admin:<JACKASS_DB_PASSWORD_DEVELOP>@34.77.188.122:5432/jackass_verona` |

## 5. Certification

**Stato attuale:** attivo. Baseline remota creata il 2026-07-12 via Cloud
Build/GCloud e Firebase preview channel.

| Area | Link / identificatore |
|---|---|
| Branch | https://github.com/FineDiMondo/il-fontanin/tree/certification |
| Workflow | https://github.com/FineDiMondo/il-fontanin/actions/workflows/deploy-certification.yml |
| Cloud Run service | `finedimondo-backend-certification` |
| Cloud Run console | https://console.cloud.google.com/run/detail/europe-west1/finedimondo-backend-certification?project=freedomrun-491323 |
| Backend URL | https://finedimondo-backend-certification-vqytacm7la-ew.a.run.app |
| Backend alternate URL | https://finedimondo-backend-certification-558649366501.europe-west1.run.app |
| Backend health | https://finedimondo-backend-certification-vqytacm7la-ew.a.run.app/community/health |
| Catalogo categorie | https://finedimondo-backend-certification-vqytacm7la-ew.a.run.app/community/catalogo/categorie |
| Firebase preview | https://el-fontanin--certification-6iwspubv.web.app |
| Firebase channel deploy | `firebase hosting:channel:deploy certification --project el-fontanin --expires 30d` |
| Ultima revisione verificata | `finedimondo-backend-certification-00001-njd` |
| Ultimo Cloud Build OK | `ae3dbdb5-9a16-4213-830c-9107865065b3` |

### Certification DB

| Campo | Valore |
|---|---|
| Stato | attivo, schema applicativo creato e seed categorie allineato |
| Cloud SQL instance | `jackass-verona-certification` |
| Cloud SQL console | https://console.cloud.google.com/sql/instances/jackass-verona-certification/overview?project=freedomrun-491323 |
| Host pubblico configurato | `35.205.224.40` |
| Database applicativo configurato | `jackass_verona` |
| User applicativo configurato | `jackass_admin` |
| Secret password | https://console.cloud.google.com/security/secret-manager/secret/JACKASS_DB_PASSWORD_CERTIFICATION/versions?project=freedomrun-491323 |
| DSN template | `postgresql://jackass_admin:<JACKASS_DB_PASSWORD_CERTIFICATION>@35.205.224.40:5432/jackass_verona` |

## 6. Production

**Stato attuale:** attivo.

| Area | Link / identificatore |
|---|---|
| Branch sorgente protetto | https://github.com/FineDiMondo/il-fontanin/tree/main |
| Workflow | https://github.com/FineDiMondo/il-fontanin/actions/workflows/deploy-production.yml |
| Cloud Run service | `finedimondo-backend` |
| Cloud Run console | https://console.cloud.google.com/run/detail/europe-west1/finedimondo-backend?project=freedomrun-491323 |
| Backend URL | https://finedimondo-backend-vqytacm7la-ew.a.run.app |
| Backend alternate URL | https://finedimondo-backend-558649366501.europe-west1.run.app |
| Backend health | https://finedimondo-backend-vqytacm7la-ew.a.run.app/community/health |
| Catalogo categorie | https://finedimondo-backend-vqytacm7la-ew.a.run.app/community/catalogo/categorie |
| Catalogo schede pubblicate | https://finedimondo-backend-vqytacm7la-ew.a.run.app/community/catalogo/schede?stato=pubblicato |
| Firebase Hosting live | https://el-fontanin.web.app |
| Firebase Hosting console | https://console.firebase.google.com/project/el-fontanin/hosting/sites/el-fontanin |
| Ultima revisione verificata | `finedimondo-backend-00019-7s4` |

### Production DB

| Campo | Valore |
|---|---|
| Stato | attivo |
| Cloud SQL instance visibile | `jackass-verona` |
| Cloud SQL console | https://console.cloud.google.com/sql/instances/jackass-verona/overview?project=freedomrun-491323 |
| Connection name | `freedomrun-491323:europe-west1:jackass-verona` |
| Host pubblico configurato | `35.241.200.140` |
| Porta | `5432` |
| Database applicativo configurato | `jackass_verona` |
| User applicativo configurato | `jackass_admin` |
| Secret password | https://console.cloud.google.com/security/secret-manager/secret/JACKASS_DB_PASSWORD/versions?project=freedomrun-491323 |
| DSN template | `postgresql://jackass_admin:<JACKASS_DB_PASSWORD>@35.241.200.140:5432/jackass_verona` |

Nota operativa: Cloud Run `finedimondo-backend` conserva anche l'annotation
`run.googleapis.com/cloudsql-instances=freedomrun-491323:europe-west1:kyuss-instance`.
La configurazione applicativa effettiva usa però `JACKASS_DB_HOST=35.241.200.140`
e `JACKASS_DB_NAME=jackass_verona`. Questa discrepanza va bonificata in un WO
dedicato prima di creare ambienti separati.

## 7. Endpoint API per stage

| Endpoint | Develop target | Certification target | Production attivo |
|---|---|---|---|
| Health | https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app/community/health | https://finedimondo-backend-certification-vqytacm7la-ew.a.run.app/community/health | https://finedimondo-backend-vqytacm7la-ew.a.run.app/community/health |
| Forum categorie | https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app/community/forum/categories | https://finedimondo-backend-certification-vqytacm7la-ew.a.run.app/community/forum/categories | https://finedimondo-backend-vqytacm7la-ew.a.run.app/community/forum/categories |
| Eventi | https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app/community/events | https://finedimondo-backend-certification-vqytacm7la-ew.a.run.app/community/events | https://finedimondo-backend-vqytacm7la-ew.a.run.app/community/events |
| Catalogo categorie | https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app/community/catalogo/categorie | https://finedimondo-backend-certification-vqytacm7la-ew.a.run.app/community/catalogo/categorie | https://finedimondo-backend-vqytacm7la-ew.a.run.app/community/catalogo/categorie |
| Catalogo pubblico | https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app/community/catalogo/schede?stato=pubblicato | https://finedimondo-backend-certification-vqytacm7la-ew.a.run.app/community/catalogo/schede?stato=pubblicato | https://finedimondo-backend-vqytacm7la-ew.a.run.app/community/catalogo/schede?stato=pubblicato |
| Canzoniere | https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app/community/canzoniere/brani | https://finedimondo-backend-certification-vqytacm7la-ew.a.run.app/community/canzoniere/brani | https://finedimondo-backend-vqytacm7la-ew.a.run.app/community/canzoniere/brani |
| Ricettario | https://finedimondo-backend-develop-vqytacm7la-ew.a.run.app/community/ricettario/ricette | https://finedimondo-backend-certification-vqytacm7la-ew.a.run.app/community/ricettario/ricette | https://finedimondo-backend-vqytacm7la-ew.a.run.app/community/ricettario/ricette |

## 8. Prerequisiti umani

- Fatto: GitHub Environment `develop`, `certification`, `production`.
- Fatto: required reviewers su `certification` e `production`.
- Fatto: servizi Cloud Run dedicati per `develop` e `certification`.
- Fatto: istanze Cloud SQL separate per `develop` e `certification`.
- Fatto: secret DB separati per non-prod, ripubblicati senza newline finale.
- Fatto: variabile frontend `VITE_API_BASE_URL` per ogni stage.
