// Configurazione i18next: multilingua per Il Fontanin.
// Lingue supportate (fase di test): it, en, ar, pt (portoghese brasiliano),
// es, hi, ur (urdu, per utenti pakistani), ne (nepalese).
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import it from './locales/it.json'
import en from './locales/en.json'
import ar from './locales/ar.json'
import pt from './locales/pt.json'
import es from './locales/es.json'
import hi from './locales/hi.json'
import ur from './locales/ur.json'
import ne from './locales/ne.json'

export const LANGUAGES = [
  { code: 'it', label: 'Italiano', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'pt', label: 'Português (BR)', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', dir: 'ltr' },
  { code: 'ur', label: 'اردو', dir: 'rtl' },
  { code: 'ne', label: 'नेपाली', dir: 'ltr' },
]

const RTL_LANGS = LANGUAGES.filter((l) => l.dir === 'rtl').map((l) => l.code)

export function applyDirection(lng) {
  const short = (lng || 'it').split('-')[0]
  const dir = RTL_LANGS.includes(short) ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = short
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
      ar: { translation: ar },
      pt: { translation: pt },
      es: { translation: es },
      hi: { translation: hi },
      ur: { translation: ur },
      ne: { translation: ne },
    },
    fallbackLng: 'it',
    supportedLngs: LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'fdm_lang',
      caches: ['localStorage'],
    },
  })

applyDirection(i18n.resolvedLanguage || i18n.language)
i18n.on('languageChanged', applyDirection)

export default i18n
