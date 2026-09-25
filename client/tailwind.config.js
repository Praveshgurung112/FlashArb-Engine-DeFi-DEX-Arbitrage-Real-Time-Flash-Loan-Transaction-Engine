/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        crypto: {
          dark: '#0a0d14',
          card: '#111622',
          border: '#1f293d',
          accent: '#00f2fe',
          profit: '#00e676',
          loss: '#ff5252',
          warning: '#ffab00',
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(0, 242, 254, 0.2))' },
        },
      },
    },
  },
  plugins: [],
};
