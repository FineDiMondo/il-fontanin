"""
Fonte unica dei metadata_schema delle categorie del Catalogo Territoriale.

Definiti in AF-CATALOGAZIONE-001-ADD-02 §2.3 (confermati da Daniel il 2026-07-08).
Usato da create_catalogo_tables.py (installazioni da zero, CI) e
update_catalogo_schemas.py (aggiornamento categorie esistenti).

Formato campo: {"chiave", "tipo": testo|numero|scelta|booleano, "opzioni"?, "obbligatorio"}
Le etichette visibili derivano dalle chiavi via i18n (catalogo.campi.<chiave>).
"""

CATEGORIE_SCHEMAS = {
    "monumenti-cristiani": {"campi": [
        {"chiave": "dedicazione", "tipo": "testo", "obbligatorio": False},
        {"chiave": "stato_conservazione", "tipo": "scelta", "opzioni": ["buono", "discreto", "degradato"], "obbligatorio": True},
    ]},
    "idrico": {"campi": [
        {"chiave": "tipo_elemento", "tipo": "scelta", "opzioni": ["risorgiva", "fontanile", "roggia", "fosso", "pozzo", "lavatoio", "altro"], "obbligatorio": True},
        {"chiave": "acqua_presente", "tipo": "booleano", "obbligatorio": True},
        {"chiave": "uso_storico", "tipo": "testo", "obbligatorio": False},
        {"chiave": "ente_gestore", "tipo": "testo", "obbligatorio": False},
    ]},
    "naturale": {"campi": [
        {"chiave": "tipo_elemento", "tipo": "scelta", "opzioni": ["albero_monumentale", "filare", "siepe_storica", "prato_stabile", "bosco", "altro"], "obbligatorio": True},
        {"chiave": "specie", "tipo": "testo", "obbligatorio": False},
        {"chiave": "eta_stimata_anni", "tipo": "numero", "obbligatorio": False},
        {"chiave": "vincolo_paesaggistico", "tipo": "booleano", "obbligatorio": False},
    ]},
    "storico": {"campi": [
        {"chiave": "tipo_elemento", "tipo": "scelta", "opzioni": ["corte_rurale", "villa", "castello", "cippo_confine", "manufatto", "sito", "altro"], "obbligatorio": True},
        {"chiave": "periodo_storico", "tipo": "scelta", "opzioni": ["pre_romano", "romano", "medievale", "veneziano", "ottocento", "novecento", "ignoto"], "obbligatorio": True},
        {"chiave": "evento_associato", "tipo": "testo", "obbligatorio": False},
        {"chiave": "stato_conservazione", "tipo": "scelta", "opzioni": ["buono", "discreto", "degradato", "scomparso"], "obbligatorio": False},
    ]},
    "culturale": {"campi": [
        {"chiave": "tipo_elemento", "tipo": "scelta", "opzioni": ["tradizione", "festa_ricorrenza", "luogo_di_ritrovo", "gioco_tradizionale", "dialetto_toponimo", "altro"], "obbligatorio": True},
        {"chiave": "periodicita", "tipo": "scelta", "opzioni": ["annuale", "stagionale", "occasionale", "scomparsa"], "obbligatorio": False},
        {"chiave": "ancora_praticata", "tipo": "booleano", "obbligatorio": True},
    ]},
    "economico": {"campi": [
        {"chiave": "tipo_attivita", "tipo": "scelta", "opzioni": ["mulino", "filanda", "fornace", "caseificio", "bottega", "osteria", "mercato", "altro"], "obbligatorio": True},
        {"chiave": "periodo_attivita", "tipo": "testo", "obbligatorio": False},
        {"chiave": "proprieta_storica", "tipo": "testo", "obbligatorio": False},
        {"chiave": "attiva_oggi", "tipo": "booleano", "obbligatorio": True},
    ]},
    "militare": {"campi": [
        {"chiave": "tipo_elemento", "tipo": "scelta", "opzioni": ["fortificazione", "trincea", "caserma", "polveriera", "cippo_militare", "rifugio", "altro"], "obbligatorio": True},
        {"chiave": "conflitto_periodo", "tipo": "scelta", "opzioni": ["pre_unitario", "risorgimento", "prima_guerra", "seconda_guerra", "guerra_fredda", "ignoto"], "obbligatorio": True},
        {"chiave": "stato_conservazione", "tipo": "scelta", "opzioni": ["buono", "discreto", "degradato", "scomparso"], "obbligatorio": False},
    ]},
}

CATEGORIE_NOMI = {
    "monumenti-cristiani": "Monumenti Cristiani",
    "idrico": "Idrico",
    "naturale": "Naturale",
    "storico": "Storico",
    "culturale": "Culturale",
    "economico": "Economico",
    "militare": "Militare",
}
