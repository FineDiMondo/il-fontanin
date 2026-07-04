// Gestione locale del saldo in punti F, per singolo utente.
// NOTA: implementazione mock su localStorage in attesa di individuare e
// collegare il servizio reale di wallet/ledger (vedi progetto "Ledger & Audit").
// Sostituire con chiamate a `api` (gia' autenticate via JWT) quando
// l'endpoint reale sara' disponibile: le firme delle funzioni sono pensate
// per restare compatibili con una versione async collegata al backend.

const DEFAULT_BALANCE = 120

function balanceKey(userId) {
  return `fdm_wallet_f_${userId}`
}
function logKey(userId) {
  return `fdm_bar_log_${userId}`
}

export function getBalance(userId) {
  const raw = localStorage.getItem(balanceKey(userId))
  return raw != null ? Number(raw) : DEFAULT_BALANCE
}

export function getContributions(userId) {
  const raw = localStorage.getItem(logKey(userId))
  return raw ? JSON.parse(raw) : []
}

export function contribute(userId, item) {
  const balance = getBalance(userId)
  if (balance < item.prezzo) {
    // Codice sentinella tradotto lato UI (vedi locales/*.json bar.insufficient)
    throw new Error('insufficient_funds')
  }
  const nuovoSaldo = balance - item.prezzo
  localStorage.setItem(balanceKey(userId), String(nuovoSaldo))

  const voce = { id: Date.now(), nome: item.nome, prezzo: item.prezzo, data: new Date().toISOString() }
  const log = [voce, ...getContributions(userId)].slice(0, 20)
  localStorage.setItem(logKey(userId), JSON.stringify(log))

  return { balance: nuovoSaldo, entry: voce }
}
