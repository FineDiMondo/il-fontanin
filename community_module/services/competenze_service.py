from community_module.models.community_models import CommunityUser

def is_validatore_per_dominio(session, user: CommunityUser, dominio_codice: str) -> bool:
    # MOCK TEMPORANEO: finché non viene implementato AT-COMPETENZE-002,
    # solo gli admin possono validare le schede del catalogo.
    if user.ruolo == "admin":
        return True
    return False
