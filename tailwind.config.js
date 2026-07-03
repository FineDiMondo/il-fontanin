/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        noce: {
          DEFAULT: '#2c1a06',
          light: '#3d2b0a',
          dark: '#1a0e02',
        },
        oro: {
          DEFAULT: '#e8c87a',
          muted: '#c9a96e',
          dark: '#9b7a42',
          pale: '#f5edd8',
        },
        pietra: {
          DEFAULT: '#8b8378',
          light: '#c4bdb0',
          pale: '#f7f0e6',
          border: '#e0d0b0',
        },
        muschio: {
          DEFAULT: '#3d5c3a',
          light: '#6b8f5e',
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
