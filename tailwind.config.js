/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

/* ============================================================
   PALETTE FREDDA "BLU RISORGIVA"
   I nomi delle classi restano invariati (noce/oro/pietra/muschio)
   per non toccare i componenti: cambiano solo i valori.
   - noce   -> blu notte (header, nav)
   - oro    -> azzurro risorgiva (accento; -dark è AA su fondo chiaro)
   - pietra -> grigio freddo (bordi, superfici)
   - muschio-> verde acqua freddo (stati positivi)
   - stone  -> rimappato su slate (grigi freddi ovunque)
   Contrasti verificati WCAG AA:
   oro-dark  #1f6e8c su bianco  ~5.3:1
   stone-700 (slate) su bianco  ~9.9:1
   oro       #8fcae2 su noce    ~9.6:1
   ============================================================ */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        stone: {
          50: '#000000',
          100: '#0a0a0a',
          200: '#171717',
          300: '#404040',
          400: '#a3a3a3',
          500: '#d4d4d4',
          600: '#e5e5e5',
          700: '#ffffff',
          800: '#ffffff',
          900: '#ffffff',
        },
        'sp-oro': 'rgb(var(--sp-oro-rgb) / <alpha-value>)',
        'sp-pietra': 'rgb(var(--sp-pietra-rgb) / <alpha-value>)',
        'sp-verde': 'rgb(var(--sp-verde-rgb) / <alpha-value>)',
        'sp-white': 'rgb(var(--sp-white-rgb) / <alpha-value>)',
        'sp-dark': 'rgb(var(--sp-dark-rgb) / <alpha-value>)',
        'sp-error': 'rgb(var(--sp-error-rgb) / <alpha-value>)',
        'sp-success': 'rgb(var(--sp-success-rgb) / <alpha-value>)',
        noce: {
          DEFAULT: '#000000',
          light: '#0a0a0a',
          dark: '#ffffff',
        },
        oro: {
          DEFAULT: '#ffffff',
          muted: '#a3a3a3',
          dark: '#ffffff',
          pale: '#000000',
        },
        pietra: {
          DEFAULT: '#ffffff',
          light: '#d4d4d4',
          pale: '#000000',
          border: '#333333',
        },
        muschio: {
          DEFAULT: '#ffffff',
          light: '#a3a3a3',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'sp-xs': 'var(--sp-xs)',
        'sp-sm': 'var(--sp-sm)',
        'sp-md': 'var(--sp-md)',
        'sp-lg': 'var(--sp-lg)',
        'sp-xl': 'var(--sp-xl)',
        'sp-2xl': 'var(--sp-2xl)',
        'sp-3xl': 'var(--sp-3xl)',
        'sp-4xl': 'var(--sp-4xl)',
      },
      fontSize: {
        'sp-font-size-xs': 'var(--sp-font-size-xs)',
        'sp-font-size-sm': 'var(--sp-font-size-sm)',
        'sp-font-size-base': 'var(--sp-font-size-base)',
        'sp-font-size-lg': 'var(--sp-font-size-lg)',
        'sp-font-size-xl': 'var(--sp-font-size-xl)',
      },
      fontWeight: {
        'sp-normal': 'var(--sp-font-weight-normal)',
        'sp-medium': 'var(--sp-font-weight-medium)',
        'sp-semibold': 'var(--sp-font-weight-semibold)',
        'sp-bold': 'var(--sp-font-weight-bold)',
      },
      borderRadius: {
        'sp-sm': 'var(--sp-radius-sm)',
        'sp-md': 'var(--sp-radius-md)',
        'sp-lg': 'var(--sp-radius-lg)',
      },
      boxShadow: {
        'sp-sm': 'var(--sp-shadow-sm)',
        sp: 'var(--sp-shadow)',
        'sp-lg': 'var(--sp-shadow-lg)',
      },
    },
  },
  plugins: [],
}
