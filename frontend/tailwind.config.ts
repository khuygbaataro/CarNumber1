import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // The logo's gold. DEFAULT is the gold itself, for filled surfaces;
        // it is far too light to read as text on white (about 2:1), so text
        // uses 700/800, which are the same hue carried down to where it can
        // be read. Anything sitting ON a brand fill takes near-black rather
        // than white, the way the gold pill on the car photos does.
        brand: {
          50: '#fff8ec',
          100: '#fff0d3',
          200: '#ffdda6',
          300: '#ffc46e',
          400: '#fda534',
          500: '#f7a21b',
          600: '#dd8109',
          700: '#b75d0a',
          800: '#944910',
          900: '#7a3d11',
          950: '#461e05',
          DEFAULT: '#f7a21b',
          light: '#ffb845',
          dark: '#dd8109',
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
