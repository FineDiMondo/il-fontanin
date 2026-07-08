from community_module.models.community_models import CommunityUser, CompetenzaDominio, CompetenzaUtente

def is_validatore_per_dominio(session, user: CommunityUser, dominio_codice: str) -> bool:
    if user.ruolo == "admin":
        return True
    if user.ruolo != "socio":
        return False
        
    dominio = session.query(CompetenzaDominio).filter(
        CompetenzaDominio.codice == dominio_codice
    ).first()
    
    if not dominio:
        return False
        
    riga = session.query(CompetenzaUtente).filter(
        CompetenzaUtente.user_id == user.id,
        CompetenzaUtente.dominio_id == dominio.id,
    ).first()
    
    return bool(riga and riga.livello_validato)
