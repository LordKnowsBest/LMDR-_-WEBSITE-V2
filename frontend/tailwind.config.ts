import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'lmdr-blue': '#2563eb',
        'lmdr-deep': '#1e40af',
        'lmdr-yellow': '#fbbf24',
        'lmdr-dark': '#0f172a',
        'beige': '#F5F5DC',
        'beige-d': '#E8E0C8',
        'tan': '#C8B896',
        'ivory': '#FFFFF5',
        'sg': '#859900',
        'driver-yellow': '#F5C518',
        'driver-yellow-dark': '#D4A017',
        'driver-yellow-light': '#FDF3C0',
        'carrier-blue': '#1B3A6B',
        'carrier-blue-light': '#2E5FA3',
        'carrier-blue-pale': '#E8EFF9',
        'neutral-dark': '#0F172A',
        'neutral-mid': '#64748B',
        'neutral-light': '#F1F5F9',
        'neutral-border': '#E2E8F0',
        'status-active': '#22C55E',
        'status-pending': '#F59E0B',
        'status-verified': '#3B82F6',
        'status-suspended': '#EF4444',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        d: ['Inter', 'sans-serif'],
      },
      borderRadius: { card: '12px' },
    },
  },
  plugins: [],
};
export default config;
