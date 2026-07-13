import { useTranslation } from 'react-i18next'
import AppHeader from '../components/AppHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import StemmaComune from '../components/StemmaComune.jsx'

/* Mappatura deterministica etichetta comune -> emblema.
   Copre anche etichette composte ("Villafranca - Custoza - Valeggio"). */
function stemmaFor(label = '') {
  const l = label.toLowerCase()
  if (l.startsWith('villafranca')) return 'villafranca'
  if (l.startsWith('povegliano')) return 'povegliano'
  if (l.startsWith('mozzecane')) return 'mozzecane'
  if (l.startsWith('vigasio')) return 'vigasio'
  if (l.startsWith('valeggio')) return 'valeggio'
  if (l.startsWith('erbè') || l.startsWith('erbe')) return 'erbe'
  if (l.startsWith('trevenzuolo')) return 'trevenzuolo'
  if (l.startsWith('nogara')) return 'nogara'
  return null
}

export default function Storia() {
  const { t } = useTranslation()
  const comuni = t('storia.comuni', { returnObjects: true })
  const eras = t('storia.eras', { returnObjects: true })

  return (
    <div className="app-shell">
      <AppHeader title={t('storia.title')} showBack />

      <div className="scroll-content px-4 py-4 space-y-4">
        <p className="text-sm text-stone-400">{t('storia.intro')}</p>

        {/* I comuni del territorio */}
        <div>
          <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium mb-2">
            {t('storia.comuni_title')}
          </p>
          <div className="space-y-3">
            {Array.isArray(comuni) && comuni.map((c, i) => (
              <div key={i} className="stone-card p-4 flex gap-3 items-start">
                {c.stemma ? (
                  <StemmaComune comune={c.stemma} variant="pieno" size={40} className="mt-0.5" />
                ) : (
                  <span
                    className="inline-block flex-shrink-0 mt-0.5 rounded-md bg-pietra-pale border border-pietra-border"
                    style={{ width: 40, height: 48 }}
                    aria-hidden="true"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-medium text-oro-dark text-sm">{c.nome}</h2>
                    {c.ruolo && (
                      <span className="text-[9px] text-stone-400 uppercase tracking-widest flex-shrink-0">{c.ruolo}</span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 leading-relaxed mt-1">{c.sintesi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline per epoche */}
        <p className="text-[10px] text-oro-dark uppercase tracking-widest font-medium pt-1">
          {t('storia.eras_title')}
        </p>

        {Array.isArray(eras) && eras.map((era, i) => (
          <div key={i} className="stone-card p-4">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h2 className="font-medium text-oro-dark">{era.title}</h2>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest flex-shrink-0">{era.period}</span>
            </div>

            <div className="space-y-3">
              {Array.isArray(era.items) && era.items.map((item, j) => {
                const stemma = stemmaFor(item.comune)
                return (
                  <div key={j} className="border-l-2 border-pietra-border pl-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {stemma && <StemmaComune comune={stemma} variant="storico" size={14} />}
                      <p className="text-[10px] text-stone-400 uppercase tracking-wide">{item.comune}</p>
                    </div>
                    <p className="text-sm font-medium text-stone-700">{item.title}</p>
                    <p className="text-sm text-stone-500 leading-relaxed mt-0.5">{item.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <p className="text-[10px] text-stone-400 leading-relaxed pt-1">
          {t('storia.disclaimer')}
        </p>
        <p className="text-[10px] text-stone-400 leading-relaxed">
          {t('storia.stemmi_note')}
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
