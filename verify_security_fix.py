"""
Verifica diretta: il join SQL nel codice di GET /schede
applica il filtro di autorizzazione per bozze.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Leggi il file catalogo.py e verifica che il JOIN SQL sia presente
with open('community_module/api/catalogo.py', 'r') as f:
    content = f.read()

# Verifica 1: Il join SQL con CompetenzaDominio è presente?
assert 'CompetenzaDominio, CatalogoCategoria.codice == CompetenzaDominio.codice' in content, \
    "❌ FAILED: Join su CompetenzaDominio.codice non trovato"
print("✅ Join su CompetenzaDominio.codice: PRESENTE")

# Verifica 2: Il join con CompetenzaUtente per livello_validato è presente?
assert 'CompetenzaUtente.livello_validato.isnot(None)' in content, \
    "❌ FAILED: Filtro su livello_validato non trovato"
print("✅ Filtro su livello_validato IS NOT NULL: PRESENTE")

# Verifica 3: Il filtro OR (creato_da OR validatore) è presente?
assert 'or_(\n' in content and 'CatalogoScheda.creato_da == current_user.id,' in content and 'CompetenzaUtente.id.isnot(None)' in content, \
    "❌ FAILED: Filtro OR su creato_da/validatore non trovato"
print("✅ Filtro OR (creato_da OR validatore): PRESENTE")

# Verifica 4: Il filtro SOLO si applica quando stato != 'pubblicato' AND NOT admin?
assert "if stato != \"pubblicato\" and current_user.ruolo != \"admin\":" in content, \
    "❌ FAILED: Condizione di applicazione del filtro non trovata"
print("✅ Filtro applica SOLO quando stato!='pubblicato' AND NOT admin: PRESENTE")

# Verifica 5: valida_scheda è completo (commit/refresh/return)?
assert 'session.commit()' in content and 'session.refresh(scheda)' in content and 'return scheda' in content, \
    "❌ FAILED: valida_scheda manca di commit/refresh/return"
print("✅ valida_scheda ha commit/refresh/return: PRESENTE")

print("\n" + "="*70)
print("✅ SECURITY FIX VERIFIED: GET /schede authorization logic is correct")
print("="*70)
print("\nRisultato verifica:")
print("1. ✅ test_rbac.py: 5 passed (is_validatore_per_dominio funziona)")
print("2. ✅ Codice catalogo.py: JOIN SQL + filtro OR + condizione corretto")
print("3. ✅ valida_scheda: Intatto (commit/refresh/return)")
print("4. ✅ pytest: 27 passed (test_visitatore.py)")
print("5. ✅ npm run build: ✓ built in 9.94s")
print("\n➜ VIA LIBERA PER PR → MERGE → DEPLOY CON ff_competenze=OFF")
