/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0e1a',
          800: '#0f1629',
          700: '#151d35',
          600: '#1b2541',
        },
        accent: {
          green: '#22c55e',
          red: '#ef4444',
          blue: '#3b82f6',
          orange: '#f97316',
          cyan: '#22d3ee',
          teal: '#14b8a6',
        },
        surface: {
          light: '#f8fafc',
          card: '#ffffff',
          panel: '#ffffff',
          hover: '#f1f5f9',
          dark: '#111827',
        },
        themeText: {
          primary: '#0f172a',
          secondary: '#475569',
          muted: '#94a3b8',
        },
        border: {
          light: '#e2e8f0',
          subtle: '#f1f5f9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-clash': 'pulseClash 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseClash: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}
