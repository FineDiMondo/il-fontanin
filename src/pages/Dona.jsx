import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import ToastContainer, { showToast } from '../components/Toast.jsx'
import { buildEpcPayload, isDonationConfigured } from '../lib/donazioneQr.js'

const IMPORTI_RAPIDI = [5, 10, 20, 50]

export default function Dona() {
  const [importo, setImporto] = useState(10)
  const canvasRef = useRef(null)
  const configurato = isDonationConfigured()

  useEffect(() => {
    if (!configurato || !canvasRef.current) return
    try {
      const payload = buildEpcPayload({ amount: importo, reference: 'Sostegno community Il Fontanin' })
      QRCode.toCanvas(canvasRef.current, payload, { width: 220, margin: 1 })
    } catch (e) {
      showToast(e.message)
    }
  }, [importo, configurato])

  return (
    <div className="app-shell">
      <ToastContainer />
      <AppHeader title="Sostieni la community" showBack />

      <div className="scroll-content px-4 py-4 space-y-4">
        <p className="text-sm text-stone-600 leading-relaxed">
          Un bonifico diretto, senza commissioni: inquadra il codice con l'app della tua banca,
          i dati si compilano da soli.
        </p>

        {!configurato ? (
          <div className="stone-card">
            <p className="text-sm text-stone-600">
              IBAN non ancora configurato. Imposta <code className="text-xs">VITE_DONATION_IBAN</code> e{' '}
              <code className="text-xs">VITE_DONATION_BENEFICIARY</code> per attivare il QR di donazione.
            </p>
          </div>
        ) : (
          <>
            <div className="stone-card flex flex-col items-center gap-3">
              <canvas ref={canvasRef} />
              <p className="text-xs text-stone-500">Importo: {importo} €</p>
            </div>

            <div className="flex gap-2">
              {IMPORTI_RAPIDI.map(v => (
                <button
                  key={v}
                  onClick={() => setImporto(v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    importo === v ? 'bg-noce text-oro border-noce' : 'border-pietra-border text-stone-600'
                  }`}
                >
                  {v} €
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-stone-500 block mb-1">Altro importo</label>
              <input
                type="number"
                min="1"
                value={importo}
                onChange={e => setImporto(e.target.value)}
                className="w-full border border-pietra-border rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
