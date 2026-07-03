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

## 3. Deploy su Vercel (link pubblico in 2 minuti)

```bash
# Installa Vercel CLI se non ce l'hai
npm install -g vercel

# Deploy dalla cartella fontanin/
cd fontanin
vercel

# Alla prima run: login con email/GitHub, poi:
# - Set up project: Yes
# - Which scope: il tuo account
# - Link to existing project: No
# - Project name: il-fontanin
# - Directory: ./
# - Override settings: No
```

Vercel chiederà di configurare le variabili d'ambiente: aggiungile
dalla dashboard Vercel oppure con:
```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_API_BASE_URL
```

Poi deploy in produzione:
```bash
vercel --prod
```

L'output sarà: `https://il-fontanin.vercel.app` (o simile).

## 4. Aggiungi il dominio Vercel a Firebase

1. Firebase Console → Authentication → Settings → Authorized domains
2. Aggiungi: `il-fontanin.vercel.app`

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
├── vercel.json        (SPA routing)
└── package.json
```
