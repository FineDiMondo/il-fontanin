# Audit di Usabilità – Il Fontanin Community

Questo documento riassume i test e gli interventi di usabilità eseguiti sui moduli del Forum, Canzoniere, Ricettario e Catalogo Territoriale.

## 1. Problemi Riscontrati e Risolti

### Forum
- **Problema**: L'endpoint `GET /community/forum/categories/{slug}/threads` restituiva un errore HTTP `500` in produzione.
- **Causa**: `DetachedInstanceError` generato da SQLAlchemy. Il thread.user veniva richiesto (lazy loading) dopo che la sessione del database era stata chiusa.
- **Risoluzione**: Implementato `joinedload(ForumThread.user)` e `joinedload(ForumPost.user)` nelle query principali del forum per forzare l'eager loading delle relazioni.

### Canzoniere e Ricettario
- **Problema**: Le pagine React mostravano lo stato vuoto ("Canzoniere vuoto" / "Ricettario vuoto") qualora l'API restituisse un errore (es. `404` se il backend non era ancora deployato con le nuove rotte).
- **Causa**: I catch block in `Canzoniere.jsx` e `Ricettario.jsx` stampavano l'errore in console ma non impostavano nessuno stato di errore, portando l'UI a valutare `brani.length === 0` e mostrare il fallback.
- **Risoluzione**: Aggiunto uno stato `error` tramite `useState` per gestire le eccezioni Axios, mostrando ora un `EmptyState` di errore più idoneo ("Servizio non disponibile").

### Motore di Catalogazione Territoriale
- **Problema**: Le chiamate API del frontend puntavano a path errati (`/community/community/catalogo...`).
- **Causa**: Il client Axios base (`api.js`) applicava già il prefisso `/community`.
- **Risoluzione**: Rimossi i prefissi superflui dai file `Catalogo*.jsx`.
- **Problema**: Impossibilità dei soci di modificare le proprie bozze.
- **Causa**: Controllo errato `scheda.creato_da === user?.id` anziché `user?.user_id`.
- **Risoluzione**: Aggiornati i riferimenti in frontend.
- **Problema**: Visualizzazione date errate nell'area validazione.
- **Risoluzione**: Allineati i nomi campi a `created_at` e `updated_at`.
- **Sicurezza**: Aggiornato lo script `create_catalogo_tables.py` in root con `argparse` e vincoli di ambiente (`--env staging`, `--yes`) per prevenire reset accidentali.

### Localizzazione (i18n)
- **Problema**: I pulsanti "Mappa" e "Numeri Utili" nella Dashboard non erano tradotti in italiano.
- **Risoluzione**: Aggiunte le chiavi `home.map_button` e `home.numbers_button` in `it.json`.

## 2. Test Implementati

Sono state create due suite di test in Python (`pytest`) per la verifica dell'integrità del sistema in integrazione continua:

1. **`test_usabilita_readonly.py`**:
   - Esegue chiamate `GET` ai principali endpoint di lettura:
     - `/community/forum/categories`
     - `/community/forum/categories/{slug}/threads`
     - `/community/canzoniere/brani`
     - `/community/ricettario/ricette`
     - `/community/catalogo/categorie`
   - Verifica che gli endpoint non restituiscano un `500` e che abbiano il corretto output JSON.
   - Progettata per essere sicura e poter girare anche in ambiente Live/Staging.

2. **`test_usabilita_write_gated.py`**:
   - Suite di test che prova la creazione di un Thread (`POST`) e di una Scheda Catalogo (`POST`).
   - Messa in sicurezza dietro una variabile d'ambiente (`FONTANIN_WRITE_TESTS=1`) per evitare scritture accidentali non previste durante i normali task di CI/CD.

## 3. Punti Aperti
- **Deploy**: I fix per il Canzoniere, Ricettario e Catalogo sono stati risolti lato frontend, ma per riflettersi in produzione è necessario eseguire il **Deploy su Cloud Run**.
- **Flusso "Scheda Respinta"**: Attendiamo indicazioni se una scheda respinta debba ritornare in stato `bozza` o ottenere uno stato `richiesta_modifiche`.
