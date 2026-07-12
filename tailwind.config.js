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
        stone: colors.slate,
        'sp-oro': 'rgb(var(--sp-oro-rgb) / <alpha-value>)',
        'sp-pietra': 'rgb(var(--sp-pietra-rgb) / <alpha-value>)',
        'sp-verde': 'rgb(var(--sp-verde-rgb) / <alpha-value>)',
        'sp-white': 'rgb(var(--sp-white-rgb) / <alpha-value>)',
        'sp-dark': 'rgb(var(--sp-dark-rgb) / <alpha-value>)',
        'sp-error': 'rgb(var(--sp-error-rgb) / <alpha-value>)',
        'sp-success': 'rgb(var(--sp-success-rgb) / <alpha-value>)',
        noce: {
          DEFAULT: '#0e2433',
          light: '#1d3d54',
          dark: '#081724',
        },
        oro: {
          DEFAULT: '#8fcae2',
          muted: '#639db5',
          dark: '#1f6e8c',
          pale: '#e8f3f8',
        },
        pietra: {
          DEFAULT: '#7e8b95',
          light: '#b9c6ce',
          pale: '#f3f7f9',
          border: '#d6e1e8',
        },
        muschio: {
          DEFAULT: '#2e6a5e',
          light: '#5f9c8d',
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
