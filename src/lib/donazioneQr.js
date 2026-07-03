// Genera il payload EPC QR Code (standard EPC069-12) per un bonifico SEPA.
// Formato gratuito e indipendente da qualunque fornitore di pagamenti:
// qualsiasi app di home banking europea sa leggerlo e precompilare il
// bonifico. Non ci sono commissioni: e' un bonifico bancario normale.
//
// IMPORTANTE: IBAN e intestatario reali vanno forniti dalla community
// (variabili d'ambiente VITE_DONATION_IBAN / VITE_DONATION_BENEFICIARY).
// Qui non viene mai inventato o hardcodato un IBAN.

export function isDonationConfigured() {
  return Boolean(import.meta.env.VITE_DONATION_IBAN && import.meta.env.VITE_DONATION_BENEFICIARY)
}

export function buildEpcPayload({ amount, reference }) {
  const iban = import.meta.env.VITE_DONATION_IBAN
  const beneficiary = import.meta.env.VITE_DONATION_BENEFICIARY
  const bic = import.meta.env.VITE_DONATION_BIC || ''

  if (!iban || !beneficiary) {
    throw new Error('IBAN o intestatario non configurati (VITE_DONATION_IBAN / VITE_DONATION_BENEFICIARY)')
  }

  const amountStr = amount ? `EUR${Number(amount).toFixed(2)}` : ''
  const remittance = (reference || 'Sostegno community Il Fontanin').slice(0, 140)

  // Struttura EPC069-12: 11 righe, alcune facoltative lasciate vuote
  const lines = [
    'BCD',
    '002',
    '1',
    'SCT',
    bic,
    beneficiary.slice(0, 70),
    iban.replace(/\s/g, ''),
    amountStr,
    '',
    '',
    remittance,
  ]
  return lines.join('\n')
}
