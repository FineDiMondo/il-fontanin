// Gestione locale del saldo in punti F.
// NOTA: implementazione mock su localStorage in attesa di individuare e
// collegare il servizio reale di wallet/ledger (vedi progetto "Ledger & Audit").
// Sostituire con chiamate a `api` quando l'endpoint reale sara' disponibile.

const BALANCE_KEY = 'fdm_wallet_f'
const LOG_KEY = 'fdm_bar_log'
const DEFAULT_BALANCE = 120

export function getBalance() {
  const raw = localStorage.getItem(BALANCE_KEY)
  return raw != null ? Number(raw) : DEFAULT_BALANCE
}

export function getContributions() {
  const raw = localStorage.getItem(LOG_KEY)
  return raw ? JSON.parse(raw) : []
}

export function contribute(item) {
  const balance = getBalance()
  if (balance < item.prezzo) {
    throw new Error('Punti F insufficienti')
  }
  const nuovoSaldo = balance - item.prezzo
  localStorage.setItem(BALANCE_KEY, String(nuovoSaldo))

  const voce = { id: Date.now(), nome: item.nome, prezzo: item.prezzo, data: new Date().toISOString() }
  const log = [voce, ...getContributions()].slice(0, 20)
  localStorage.setItem(LOG_KEY, JSON.stringify(log))

  return { balance: nuovoSaldo, entry: voce }
}
