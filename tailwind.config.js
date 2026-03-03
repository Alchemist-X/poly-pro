/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dune: {
          bg: '#0d0f14',
          card: '#1a1d25',
          'card-hover': '#22252e',
          border: '#2d3039',
          text: '#e6e8eb',
          muted: '#8a8f98',
          green: '#00d395',
          red: '#ff5c5c',
          blue: '#4c9aff',
          orange: '#f5a623',
          purple: '#b18cfe',
        },
      },
    },
  },
  plugins: [],
}
