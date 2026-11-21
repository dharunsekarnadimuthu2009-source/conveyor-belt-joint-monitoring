/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        status: {
          teal: {
            DEFAULT: '#0d9488', // Teal for Normal
            light: '#14b8a6',
            dark: '#0f766e',
            bg: 'rgba(13, 148, 136, 0.1)',
            border: 'rgba(13, 148, 136, 0.3)'
          },
          amber: {
            DEFAULT: '#f59e0b', // Amber for Warning
            light: '#fbbf24',
            dark: '#d97706',
            bg: 'rgba(245, 158, 11, 0.1)',
            border: 'rgba(245, 158, 11, 0.3)'
          },
          red: {
            DEFAULT: '#ef4444', // Red for Critical
            light: '#f87171',
            dark: '#dc2626',
            bg: 'rgba(239, 68, 68, 0.1)',
            border: 'rgba(239, 68, 68, 0.3)'
          }
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
