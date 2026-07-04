import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n.js'

export default function LanguageSelector() {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = (i18n.resolvedLanguage || i18n.language || 'it').split('-')[0]
  const currentLang = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0]

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function selectLanguage(code) {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="touch-target text-oro-muted hover:text-oro transition-colors flex items-center gap-1"
        aria-label={t('common.language')}
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.6 4 6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-6-4-9s1.5-6.4 4-9z" />
        </svg>
        <span className="text-[10px] uppercase text-oro-dark">{current}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 bg-noce border border-oro-dark/30 rounded-lg shadow-lg overflow-hidden z-50"
          style={{ maxHeight: '60vh', overflowY: 'auto' }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                lang.code === currentLang.code
                  ? 'bg-oro/20 text-oro'
                  : 'text-oro-muted hover:bg-oro/10 hover:text-oro'
              }`}
              dir={lang.dir}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
