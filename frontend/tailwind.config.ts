import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Every one of these reads a variable from globals.css — see the
        // note there. The numbered steps are kept because the code already
        // speaks in them, and each is pointed at the token that fits.
        brand: {
          50: 'rgb(var(--brand-tint) / <alpha-value>)',
          100: 'rgb(var(--brand-soft) / <alpha-value>)',
          200: 'rgb(var(--brand-soft) / <alpha-value>)',
          300: 'rgb(var(--brand) / <alpha-value>)',
          400: 'rgb(var(--brand) / <alpha-value>)',
          500: 'rgb(var(--brand) / <alpha-value>)',
          600: 'rgb(var(--brand-hover) / <alpha-value>)',
          700: 'rgb(var(--brand-ink) / <alpha-value>)',
          800: 'rgb(var(--brand-text) / <alpha-value>)',
          900: 'rgb(var(--brand-ink) / <alpha-value>)',
          950: 'rgb(var(--brand-ink) / <alpha-value>)',
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          light: 'rgb(var(--brand-soft) / <alpha-value>)',
          dark: 'rgb(var(--brand-hover) / <alpha-value>)',
          hover: 'rgb(var(--brand-hover) / <alpha-value>)',
          soft: 'rgb(var(--brand-soft) / <alpha-value>)',
          tint: 'rgb(var(--brand-tint) / <alpha-value>)',
          ink: 'rgb(var(--brand-ink) / <alpha-value>)',
          text: 'rgb(var(--brand-text) / <alpha-value>)',
        },
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        page: 'rgb(var(--page) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        accent: {
          50: '#fff1f3',
          100: '#ffe0e5',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          DEFAULT: '#e11d48',
        },
        // "Шинээр ирсэн" badges and success states.
        fresh: {
          50: '#ecfdf5',
          100: '#d1fae5',
          600: '#059669',
          700: '#047857',
          DEFAULT: '#059669',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)',
        'card-hover':
          '0 14px 28px -10px rgb(16 24 40 / 0.18), 0 4px 10px -4px rgb(16 24 40 / 0.08)',
        soft: '0 2px 10px rgb(16 24 40 / 0.06)',
        // Upward shadow for the sticky mobile action bar.
        bar: '0 -4px 20px rgb(16 24 40 / 0.12)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
