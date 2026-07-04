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
    },
  },
  plugins: [],
}
