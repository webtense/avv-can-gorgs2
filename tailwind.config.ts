import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#0A0A0A',
      primary: {
        DEFAULT: '#8B1E2D',
        dark: '#6B1620',
        light: '#A8394A',
      },
      secondary: {
        DEFAULT: '#D4A574',
        dark: '#B8894F',
        light: '#E4C398',
      },
      'accent-search': {
        DEFAULT: '#10B981',
        dark: '#059669',
      },
      'accent-highlight': {
        DEFAULT: '#F59E0B',
        dark: '#D97706',
      },
      slate: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
      },
      emerald: {
        50: '#ECFDF5',
        100: '#D1FAE5',
        500: '#10B981',
        600: '#059669',
        700: '#047857',
      },
      amber: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        500: '#F59E0B',
        600: '#D97706',
        700: '#B45309',
      },
      red: {
        50: '#FEF2F2',
        500: '#EF4444',
        700: '#B91C1C',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-outfit)', 'Outfit', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'serif'],
      },
      maxWidth: {
        '8xl': '90rem',
      },
    },
  },
  plugins: [],
};

export default config;
