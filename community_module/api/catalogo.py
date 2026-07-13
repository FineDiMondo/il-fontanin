from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from community_module.models.community_models import (
    get_session, CommunityUser, CatalogoCategoria, CatalogoSottocategoria, 
    CatalogoScheda, CatalogoMedia
)
from community_module.models.schemas import (
    CatalogoCategoriaOut, CatalogoSchedaCreate, CatalogoSchedaOut, 
    CatalogoSchedaUpdate, CatalogoSchedaValida, CatalogoMediaOut,
    CatalogoMediaBase
)
from community_module.auth.community_auth import get_current_user, get_current_user_optional, require_admin
from community_module.services.competenze_service import is_validatore_per_dominio
from community_module.services.google_drive_service import GoogleDriveService

router = APIRouter(prefix="/catalogo", tags=["Catalogo Territoriale"])

def require_socio(current_user: CommunityUser = Depends(get_current_user)) -> CommunityUser:
    if current_user.ruolo not in ["socio", "admin"]:
        raise HTTPException(status_code=403, detail="Richiesta qualifica Socio")
    return current_user

def require_validatore_dominio(categoria_codice: str):
    def _dep(current_user: CommunityUser = Depends(get_current_user)) -> CommunityUser:
        session = next(get_db_session())
        try:
            if not is_validatore_per_dominio(session, current_user, categoria_codice):
                raise HTTPException(status_code=403, detail="Richiesta qualifica Validatore per questo dominio")
            return current_user
        finally:
            session.close()
    return _dep

def get_db_session():
    session = get_session()
    try:
        yield session
    finally:
        session.close()

@router.get("/categorie", response_model=List[CatalogoCategoriaOut])
def get_categorie(session: Session = Depends(get_db_session)):
    categorie = session.query(CatalogoCategoria).filter(CatalogoCategoria.attivo == True).all()
    return categorie

@router.get("/schede", response_model=List[CatalogoSchedaOut])
def get_schede(
    categoria_id: Optional[UUID] = None,
    regno_codice: Optional[str] = Query(None, description="Filtra per codice regno"),
    categoria_codice: Optional[str] = Query(None, description="Filtra per codice categoria"),
    categorie: Optional[str] = Query(None, description="Lista codici categoria (comma-separated)"),
    stato: str = Query("pubblicato", description="Filtro per stato"),
    bbox: Optional[str] = Query(None, description="Bounding box 'min_lng,min_lat,max_lng,max_lat'"),
    session: Session = Depends(get_db_session),
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional)
):
    from sqlalchemy import and_, or_
    from community_module.models.community_models import CompetenzaDominio, CompetenzaUtente, StrutturaRegnoCategoria

    # Regola anti-ambiguità: al massimo un filtro di categorizzazione
    filtri_forniti = sum(1 for x in [categoria_id, regno_codice, categoria_codice, categorie] if x is not None)
    if filtri_forniti > 1:
        raise HTTPException(status_code=400, detail="Fornire solo uno tra categoria_id, regno_codice, categoria_codice o categorie")

    # Se lo stato non è 'pubblicato', l'utente DEVE essere autenticato
    if stato != "pubblicato":
        if not current_user:
            raise HTTPException(status_code=401, detail="Non autorizzato a vedere bozze")

    # Query base: schede per stato
    query = session.query(CatalogoScheda).filter(CatalogoScheda.stato == stato)

    # AUTORIZZAZIONE: Se stato != 'pubblicato' e utente NON è admin, filtra per visibilità
    # Bozze visibili SOLO al creatore oppure ai validatori della categoria
    if stato != "pubblicato" and current_user.ruolo != "admin":
        query = query.outerjoin(CatalogoCategoria).outerjoin(
            CompetenzaDominio, CatalogoCategoria.codice == CompetenzaDominio.codice
        ).outerjoin(
            CompetenzaUtente, and_(
                CompetenzaUtente.dominio_id == CompetenzaDominio.id,
                CompetenzaUtente.user_id == current_user.id,
                CompetenzaUtente.livello_validato.isnot(None)
            )
        ).filter(
            or_(
                CatalogoScheda.creato_da == current_user.id,
                CompetenzaUtente.id.isnot(None)
            )
        )

    if categoria_id:
        query = query.filter(CatalogoScheda.categoria_id == categoria_id)
    elif categoria_codice:
        query = query.join(CatalogoCategoria).filter(CatalogoCategoria.codice == categoria_codice)
    elif categorie:
        codici = [c.strip() for c in categorie.split(",") if c.strip()]
        if codici:
            query = query.join(CatalogoCategoria).filter(CatalogoCategoria.codice.in_(codici))
    elif regno_codice:
        # Trova tutte le categorie associate a questo regno
        query = query.join(
            StrutturaRegnoCategoria, 
            CatalogoScheda.categoria_id == StrutturaRegnoCategoria.categoria_id
        ).filter(StrutturaRegnoCategoria.regno_codice == regno_codice)
    if bbox:
        try:
            min_lng, min_lat, max_lng, max_lat = map(float, bbox.split(","))
            query = query.filter(
                CatalogoScheda.lng >= min_lng,
                CatalogoScheda.lng <= max_lng,
                CatalogoScheda.lat >= min_lat,
                CatalogoScheda.lat <= max_lat
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato bbox non valido")

    # Nel pilot limitiamo a 100
    schede = query.limit(100).all()
    return schede

def _valida_metadata_schema(schema_fields, data):
    if not schema_fields:
        return
    for campo in schema_fields:
        if campo.get("obbligatorio", False):
            chiave = campo.get("chiave")
            if not data or chiave not in data or not data[chiave]:
                raise HTTPException(status_code=422, detail=f"Campo obbligatorio mancante in metadata_specifici: {chiave}")

@router.post("/schede", response_model=CatalogoSchedaOut)
def create_scheda(
    scheda_in: CatalogoSchedaCreate,
    session: Session = Depends(get_db_session),
    current_user: CommunityUser = Depends(require_socio)
):
    categoria = session.query(CatalogoCategoria).filter_by(id=scheda_in.categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria non trovata")
        
    # Validazione campi dinamici
    if categoria.metadata_schema and "campi" in categoria.metadata_schema:
        _valida_metadata_schema(categoria.metadata_schema["campi"], scheda_in.metadata_specifici)
        
    nuova_scheda = CatalogoScheda(
        categoria_id=scheda_in.categoria_id,
        sottocategoria_id=scheda_in.sottocategoria_id,
        nome=scheda_in.nome,
        lat=scheda_in.lat,
        lng=scheda_in.lng,
        descrizione=scheda_in.descrizione,
        cronologia_storica=scheda_in.cronologia_storica,
        evidenza_livello=scheda_in.evidenza_livello,
        evidenza_fonte=scheda_in.evidenza_fonte,
        evidenza_data_verifica=scheda_in.evidenza_data_verifica,
        metadata_specifici=scheda_in.metadata_specifici,
        stato="bozza",
        creato_da=current_user.id
    )
    
    session.add(nuova_scheda)
    session.commit()
    session.refresh(nuova_scheda)
    return nuova_scheda

@router.get("/schede/{id}", response_model=CatalogoSchedaOut)
def get_scheda(
    id: UUID, 
    session: Session = Depends(get_db_session),
    current_user: Optional[CommunityUser] = Depends(get_current_user_optional)
):
    scheda = session.query(CatalogoScheda).filter_by(id=id).first()
    if not scheda:
        raise HTTPException(status_code=404, detail="Scheda non trovata")
        
    if scheda.stato != "pubblicato":
        if not current_user:
            raise HTTPException(status_code=401, detail="Non autenticato")
        # Nel pilot, admin, validatori o creatore
        if current_user.ruolo != "admin" and scheda.creato_da != current_user.id:
            if not is_validatore_per_dominio(session, current_user, scheda.categoria.codice):
                raise HTTPException(status_code=403, detail="Non autorizzato a leggere questa bozza")
                
    return scheda

@router.patch("/schede/{id}", response_model=CatalogoSchedaOut)
def update_scheda(
    id: UUID,
    scheda_in: CatalogoSchedaUpdate,
    session: Session = Depends(get_db_session),
    current_user: CommunityUser = Depends(require_socio)
):
    scheda = session.query(CatalogoScheda).filter_by(id=id).first()
    if not scheda:
        raise HTTPException(status_code=404, detail="Scheda non trovata")
        
    if scheda.creato_da != current_user.id and current_user.ruolo != "admin":
        raise HTTPException(status_code=403, detail="Non autorizzato")
        
    if scheda.stato not in ["bozza", "richiesta_modifiche"] and current_user.ruolo != "admin":
        raise HTTPException(status_code=400, detail="Solo l'admin può modificare schede in questo stato")
        
    update_data = scheda_in.model_dump(exclude_unset=True)
    
    # Se la scheda era in richiesta_modifiche e viene modificata dal creatore, torna in bozza
    if scheda.stato == "richiesta_modifiche":
        scheda.stato = "bozza"
    
    # Validazione campi se aggiorniamo metadata
    if "metadata_specifici" in update_data:
        categoria = scheda.categoria
        if categoria.metadata_schema and "campi" in categoria.metadata_schema:
            _valida_metadata_schema(categoria.metadata_schema["campi"], update_data["metadata_specifici"])
            
    for field, value in update_data.items():
        setattr(scheda, field, value)
        
    session.commit()
    session.refresh(scheda)
    return scheda

@router.post("/schede/{id}/proponi-modifica", response_model=CatalogoSchedaOut)
def proponi_modifica(
    id: UUID,
    session: Session = Depends(get_db_session),
    current_user: CommunityUser = Depends(require_socio)
):
    scheda_orig = session.query(CatalogoScheda).filter_by(id=id).first()
    if not scheda_orig or scheda_orig.stato != "pubblicato":
        raise HTTPException(status_code=400, detail="Scheda non trovata o non pubblicata")
        
    nuova_scheda = CatalogoScheda(
        categoria_id=scheda_orig.categoria_id,
        sottocategoria_id=scheda_orig.sottocategoria_id,
        nome=scheda_orig.nome,
        lat=scheda_orig.lat,
        lng=scheda_orig.lng,
        descrizione=scheda_orig.descrizione,
        cronologia_storica=scheda_orig.cronologia_storica,
        evidenza_livello=scheda_orig.evidenza_livello,
        evidenza_fonte=scheda_orig.evidenza_fonte,
        evidenza_data_verifica=scheda_orig.evidenza_data_verifica,
        metadata_specifici=scheda_orig.metadata_specifici,
        stato="bozza",
        scheda_precedente_id=scheda_orig.id,
        creato_da=current_user.id
    )
    session.add(nuova_scheda)
    session.commit()
    session.refresh(nuova_scheda)
    return nuova_scheda

@router.post("/schede/{id}/media", response_model=CatalogoMediaOut)
def upload_media(
    id: UUID,
    tipo: str = Form(...),
    file: UploadFile = File(...),
    descrizione: Optional[str] = Form(None),
    session: Session = Depends(get_db_session),
    current_user: CommunityUser = Depends(require_socio)
):
    scheda = session.query(CatalogoScheda).filter_by(id=id).first()
    if not scheda:
        raise HTTPException(status_code=404, detail="Scheda non trovata")
        
    if scheda.creato_da != current_user.id and current_user.ruolo != "admin":
        raise HTTPException(status_code=403, detail="Non autorizzato")
        
    # MAX 28 MB check pre-upload in mem/spool non banalissimo con FastAPI senza leggere tutto
    # Assumiamo limitato da middleware/reverse proxy (Cloud Run).
    
    drive_service = GoogleDriveService()
    file_bytes = file.file.read()
    if len(file_bytes) > 28 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File supera i 28MB")
        
    drive_file_id = drive_service.upload_file(file_bytes, file.filename, mime_type=file.content_type)
    
    media = CatalogoMedia(
        scheda_id=id,
        tipo=tipo,
        modalita_acquisizione="upload_server",
        drive_file_id=drive_file_id,
        nome_file=file.filename,
        descrizione=descrizione,
        uploaded_by=current_user.id
    )
    session.add(media)
    session.commit()
    session.refresh(media)
    return media

@router.post("/schede/{id}/media/link", response_model=CatalogoMediaOut)
def upload_media_link(
    id: UUID,
    media_in: CatalogoMediaBase,
    session: Session = Depends(get_db_session),
    current_user: CommunityUser = Depends(require_socio)
):
    scheda = session.query(CatalogoScheda).filter_by(id=id).first()
    if not scheda:
        raise HTTPException(status_code=404, detail="Scheda non trovata")
        
    if scheda.creato_da != current_user.id and current_user.ruolo != "admin":
        raise HTTPException(status_code=403, detail="Non autorizzato")
        
    media = CatalogoMedia(
        scheda_id=id,
        tipo=media_in.tipo,
        modalita_acquisizione=media_in.modalita_acquisizione,
        url_esterno=media_in.url_esterno,
        drive_file_id=media_in.drive_file_id,
        nome_file=media_in.nome_file,
        descrizione=media_in.descrizione,
        uploaded_by=current_user.id
    )
    session.add(media)
    session.commit()
    session.refresh(media)
    return media

# L'endpoint /valida necessita del controllo dinamico su require_validatore_dominio,
# ma in FastAPI i Depends valutati dinamicamente dal payload non sono banali sul decoratore.
# Valuteremo la qualifica direttamente nel corpo.
@router.post("/schede/{id}/valida", response_model=CatalogoSchedaOut)
def valida_scheda(
    id: UUID,
    payload: CatalogoSchedaValida,
    session: Session = Depends(get_db_session),
    current_user: CommunityUser = Depends(get_current_user)
):
    scheda = session.query(CatalogoScheda).filter_by(id=id).first()
    if not scheda:
        raise HTTPException(status_code=404, detail="Scheda non trovata")
        
    if scheda.stato != "bozza":
        raise HTTPException(status_code=400, detail="La scheda non è in bozza")
        
    # Check validatore per questa categoria
    if not is_validatore_per_dominio(session, current_user, scheda.categoria.codice):
        raise HTTPException(status_code=403, detail="Richiesta qualifica Validatore per questa categoria")
        
    if payload.approvata:
        if not scheda.evidenza_livello:
            raise HTTPException(status_code=422, detail="evidenza_livello obbligatorio per approvare")
        # AT-ADD-02 §2.2: C e D sono affermazioni basate su fonti — senza fonte non sono verificabili
        if scheda.evidenza_livello in ("C", "D") and not (scheda.evidenza_fonte or "").strip():
            raise HTTPException(status_code=422, detail="evidenza_fonte obbligatoria per livelli C e D")
        scheda.stato = "pubblicato"
    else:
        if not payload.nota_validazione:
            raise HTTPException(status_code=422, detail="nota_validazione obbligatoria per respingere")
        scheda.stato = "richiesta_modifiche"
        
    scheda.validato_da = current_user.id
    scheda.validato_at = datetime.now(timezone.utc)
    scheda.nota_validazione = payload.nota_validazione
    
    session.commit()
    session.refresh(scheda)
    return scheda
