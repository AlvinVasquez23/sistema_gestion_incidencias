/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        surface2: 'rgb(var(--c-surface2) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        adecco: { DEFAULT: '#E30613', hover: '#FF2E3B', pressed: '#C00410' },
        info: { DEFAULT: '#00a2fd', soft: '#98cbff' },
        ok: { DEFAULT: '#008158', soft: '#4edea3' },
        warn: { DEFAULT: '#f2b705' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.05), 0 6px 20px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}