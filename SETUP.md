# Il Fontanin — Guida Setup e Deploy

## 1. Configura Firebase (5 minuti)

1. Vai su https://console.firebase.google.com
2. Crea un nuovo progetto: "il-fontanin"
3. Authentication → Sign-in method → Google → Abilita
4. Impostazioni progetto → App web → Aggiungi app → copia le credenziali
5. Crea il file `.env.local` nella cartella `fontanin/`:

```
VITE_FIREBASE_API_KEY=AIza...il-tuo-api-key
VITE_FIREBASE_AUTH_DOMAIN=il-fontanin.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=il-fontanin
VITE_FIREBASE_APP_ID=1:xxx:web:xxx
VITE_API_BASE_URL=https://freedomrun-491323.ey.r.appspot.com
```

## 2. Installa dipendenze e avvia in locale

```bash
cd fontanin
npm install
npm run dev
# Apri http://localhost:5173
```

## 3. Deploy su Firebase Hosting

```bash
# Installa Firebase CLI se non ce l'hai
npm install -g firebase-tools
firebase login

# Build e deploy dalla cartella fontanin/
cd fontanin
npm run build
firebase deploy --only hosting --project el-fontanin
```

Le variabili d'ambiente (`VITE_FIREBASE_*`, `VITE_API_BASE_URL`) vanno
in `.env.local` PRIMA della build: Vite le compila nel bundle.

L'app è servita su: `https://el-fontanin.web.app`.

## 4. Domini autorizzati su Firebase Auth

1. Firebase Console → Authentication → Settings → Authorized domains
2. Verifica che `el-fontanin.web.app` sia presente (lo è di default)

## 5. Backend: configura Firebase Admin sul Community Module

```bash
# Su GCP Secret Manager
gcloud secrets create firebase-service-account --data-file=serviceAccount.json

# Imposta env var su Cloud Run
gcloud run services update freedomrun-community \
  --region europe-west1 \
  --set-env-vars FIREBASE_SERVICE_ACCOUNT_PATH=/secrets/firebase-sa.json \
  --set-secrets /secrets/firebase-sa.json=firebase-service-account:latest
```

## Struttura finale

```
fontanin/
├── src/
│   ├── pages/         Login, Home, Forum, Chat, Events, Research
│   ├── components/    AppHeader, BottomNav, FeedCard, Toast, UserAvatar...
│   ├── context/       AuthContext (Google OAuth + JWT)
│   ├── api/           client.js (Axios + interceptor Bearer)
│   ├── firebase.js
│   └── App.jsx
├── public/            favicon.svg
├── .env.local         (non committare!)
├── firebase.json      (hosting + SPA rewrite)
└── package.json
```
