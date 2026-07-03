# Il Fontanin

App della comunità del Fontanin — Villafranca di Verona (loc. Sant'Andrea).

Il Fontanin è una risorgiva usata dagli anni '60 come piscina naturale e punto
di ritrovo. Questa app supporta la comunità di volontari che se ne prende cura
e il movimento civico che chiede l'istituzione di un parco pubblico nell'area.

## Stack tecnico

- **Frontend**: React 18 + Vite + Tailwind CSS, PWA (vite-plugin-pwa)
- **Autenticazione**: Firebase Auth (Google Sign-In)
- **Backend**: API su Google Cloud Run
- **Hosting**: Vercel

## Moduli

| Modulo | Descrizione |
|---|---|
| Login | Accesso con Google |
| Home | Bacheca principale |
| Forum | Discussioni della community |
| Chat | Messaggistica |
| Eventi | Calendario giornate di pulizia e incontri |
| Ricerca | Ricerca contenuti |

## Setup locale

Vedi [SETUP.md](./SETUP.md) per la configurazione completa di Firebase e il deploy su Vercel.

```bash
npm install
npm run dev
# http://localhost:5173
```

## Come contribuire

Vedi [CONTRIBUTING.md](./CONTRIBUTING.md).

## Governance del progetto

Vedi [docs/GOVERNANCE.md](./docs/GOVERNANCE.md) per ruoli, responsabilità e processo decisionale della community.
