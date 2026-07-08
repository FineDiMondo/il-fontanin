import sys
import os
from unittest.mock import MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from community_module.models.community_models import CommunityUser, CompetenzaDominio, CompetenzaUtente
from community_module.services.competenze_service import is_validatore_per_dominio

def test_is_validatore_admin():
    session = MagicMock()
    user = CommunityUser(id="123", ruolo="admin")
    
    assert is_validatore_per_dominio(session, user, "monumenti-cristiani") == True
    
def test_is_validatore_guest():
    session = MagicMock()
    user = CommunityUser(id="123", ruolo="guest")
    
    assert is_validatore_per_dominio(session, user, "monumenti-cristiani") == False

def test_is_validatore_socio_no_dominio():
    session = MagicMock()
    user = CommunityUser(id="123", ruolo="socio")
    session.query.return_value.filter.return_value.first.return_value = None # No dominio
    
    assert is_validatore_per_dominio(session, user, "monumenti-cristiani") == False
    
def test_is_validatore_socio_no_competenza():
    session = MagicMock()
    user = CommunityUser(id="123", ruolo="socio")
    
    dominio = CompetenzaDominio(id="dom_123", codice="monumenti-cristiani")
    
    def mock_first():
        if "CompetenzaDominio" in str(session.query.call_args):
            return dominio
        return None
        
    session.query.return_value.filter.return_value.first.side_effect = mock_first
    
    assert is_validatore_per_dominio(session, user, "monumenti-cristiani") == False

def test_is_validatore_socio_validato():
    session = MagicMock()
    user = CommunityUser(id="123", ruolo="socio")
    
    dominio = CompetenzaDominio(id="dom_123", codice="monumenti-cristiani")
    competenza = CompetenzaUtente(livello_validato="base")
    
    def mock_first():
        call_str = str(session.query.call_args)
        if "CompetenzaDominio" in call_str:
            return dominio
        if "CompetenzaUtente" in call_str:
            return competenza
        return None
        
    session.query.return_value.filter.return_value.first.side_effect = mock_first
    
    assert is_validatore_per_dominio(session, user, "monumenti-cristiani") == True

print("All tests passed!")
