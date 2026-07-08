# AT-RICETTARIO-004 — Analisi Tecnica
## Ricettario Comunitario — El Fontanin / Fine di Mondo APS

| Campo | Valore |
|---|---|
| Documento | AT-RICETTARIO-004 |
| Fase | Analisi Tecnica (AT) |
| Base | AF-RICETTARIO-004 |
| Autore | Gemini/Antigravity |
| Validazione | Claude (prima dell'handoff a sviluppo) |
| Stack target | PostgreSQL + FastAPI (`community_module`) + React |

---

## 1. Rilievi Architetturali e Scelte Preliminari

Come per il Canzoniere, il Ricettario vivrà nell'ecosistema PostgreSQL.
**Punto aperto risolto (Storage Foto):** L'AF si chiedeva quale engine usare per le foto caricate per le ricette (Fase 3/opzionale). Questa AT propone l'utilizzo uniforme di **GoogleDriveService**. Avendo validato il corretto funzionamento dell'upload chunked in AT-CATALOGAZIONE-001-ADD-01, riutilizzare Google Drive abbatte i costi e previene la frammentazione dello storage (Firestore da una parte, Drive dall'altra).

## 2. Schema Dati (PostgreSQL / SQLAlchemy)

Le entità in `community_models.py` risulteranno così strutturate:

```python
class RicettarioRicetta(Base):
    __tablename__ = "ricettario_ricette"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    nome              = Column(String(200), nullable=False)
    categoria         = Column(String(100))
    tipo_cucina       = Column(String(100))
    porzioni_base     = Column(Integer, nullable=False, default=4)
    tempo_prep_min    = Column(Integer)
    tempo_cottura_min = Column(Integer)
    difficolta        = Column(String(50)) # Facile, Media, Complessa
    procedimento      = Column(JSONB, nullable=False) # Array di stringhe/step strutturati
    tag_dietetici     = Column(JSONB) # ["vegano", "senza glutine"]
    
    fonte             = Column(String(50), default="manuale")
    fonte_url         = Column(String(500))
    licenza           = Column(String(100))
    foto_drive_id     = Column(String(200)) # Implementazione opzionale per la Fase 3
    
    creato_da         = Column(UUID(as_uuid=True), ForeignKey("community_users.id"), nullable=False)
    modificato_da     = Column(UUID(as_uuid=True), ForeignKey("community_users.id"))
    created_at        = Column(DateTime(timezone=True), nullable=False, default=func.now())
    versione          = Column(Integer, nullable=False, default=1)

class RicettarioIngrediente(Base):
    __tablename__ = "ricettario_ingredienti"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    ricetta_id = Column(UUID(as_uuid=True), ForeignKey("ricettario_ricette.id", ondelete="CASCADE"), nullable=False)
    nome       = Column(String(200), nullable=False)
    quantita   = Column(Numeric(10, 2)) # Usiamo numerico per supportare decimali (es. 1.5)
    unita      = Column(String(50)) # g, ml, pezzi, ecc.
    opzionale  = Column(Boolean, default=False)
    note       = Column(String(200))
    ordine     = Column(Integer, default=0)

# Tabelle ricettario_versioni, ricettario_raccolte e ricettario_raccolte_ricette seguiranno 
# esattamente la stessa struttura definita nel Canzoniere per consistenza di dominio.
```

## 3. Logica di Scaling delle Dosi (Frontend)

L'AF richiedeva la definizione della policy di arrotondamento e formattazione per lo scaling delle porzioni.
La logica risiederà puramente in un hook React o utility JS (`src/utils/recipeScaler.js`):

1. **Moltiplicatore**: `fattore = porzioniDesiderate / porzioni_base`.
2. **Grammi/MilliLitri (g, ml, kg, l)**: Si arrotonda al numero intero più vicino (`Math.round(quantita * fattore)`). Nessuno misura 12.3 grammi di farina.
3. **Unità discrete (uova, spicchi, pezzi, cucchiai)**: Si mantiene il decimale fino a 1 cifra se non è zero, oppure si formatta come frazione (es. "1.5 uova", "0.5 spicchi d'aglio").
4. **Quantità nulla (q.b., un pizzico)**: Il campo `quantita` nel DB sarà `null`. Lo scaling ignorerà queste righe riproponendo la dicitura testuale.

## 4. API Endpoints (`community_module/api/ricettario.py`)

Gli endpoint esposti saranno quasi gemelli a quelli del Canzoniere:
- `GET /ricette`
- `GET /ricette/{id}` (Include la subquery per caricare gli ingredienti ordinati)
- `POST /ricette` e `PUT /ricette/{id}`: Questi endpoint dovranno gestire la creazione/aggiornamento *atomico* della ricetta e dei relativi ingredienti (ricevendo il JSON completo e sincronizzando la tabella `ricettario_ingredienti`).
- Sincronizzazione storico in `ricettario_versioni`.

## 5. UI/UX Frontend

- **Editor Strutturato**: Invece di una singola `textarea`, l'interfaccia di inserimento avrà campi dinamici (+ / -) per gli Ingredienti e per i Passaggi del Procedimento.
- **Toggle Dosi**: Nella vista di dettaglio di una ricetta, un selettore (es. - 4 + ) modificherà dinamicamente la resa degli ingredienti scalando i numeri.

## 6. Rischi e Punti Aperti

| Punto | Chi decide | Nota |
|---|---|---|
| Storage Foto | Daniel | Confermare formalmente l'uso di `GoogleDriveService` per le foto del Ricettario, evitando nuovi costi per lo storage. |
| Import TheMealDB (Fase 2) | Daniel | Manteniamo la roadmap che lo esclude dalla Fase 1 (MVP). |

## 7. Handoff a Sviluppo
- [ ] Creare modelli SQLAlchemy in `community_models.py` (Ricette, Ingredienti, Versioni, Raccolte).
- [ ] Predisporre Pydantic Schemas e API Router in `ricettario.py`.
- [ ] Sviluppare `src/utils/recipeScaler.js` per lo scaling e arrotondamento lato client.
- [ ] Implementare la UI React: `Ricettario.jsx`, vista dettaglio con scaler dinamico, e l'editor strutturato.
