import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Full scale around the original brand blue. `DEFAULT`/`light`/`dark`
        // are kept so every existing bg-brand / text-brand / hover:bg-brand-dark
        // class keeps working exactly as before.
        brand: {
          50: '#eff5ff',
          100: '#dbe8fe',
          200: '#bfd7fe',
          300: '#93bbfd',
          400: '#6096fa',
          500: '#3b74f6',
          600: '#2557eb',
          700: '#1d43d8',
          800: '#0b3d91',
          900: '#0d2f6e',
          950: '#081d45',
          DEFAULT: '#0b3d91',
          light: '#1e56c4',
          dark: '#072a66',
        },
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
