import type {Config} from 'tailwindcss';

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
    './lib/*.ts',
  ],
  plugins: [require('@headlessui/tailwindcss'), require('@tailwindcss/forms')],
  safelist: [
    {
      pattern:
        /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
  ],
  theme: {
    current: 'currentColor',
    extend: {
      animation: {
        'slow-pulse': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      borderRadius: {
        'tremor-default': '0.5rem',
        'tremor-full': '9999px',
        'tremor-small': '0.375rem',
      },
      boxShadow: {
        'dark-tremor-card':
          '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'dark-tremor-dropdown':
          '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'dark-tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'tremor-card':
          '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'tremor-dropdown':
          '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      colors: {
        'dark-tremor': {
          background: {
            DEFAULT: '#0a0a0a',
            emphasis: '#d1d5db',
            muted: '#0a0a0a',
            subtle: '#252525',
          },
          border: {
            DEFAULT: '#252525',
          },
          brand: {
            DEFAULT: '#f9fafb',
            emphasis: '#d1d5db',
            faint: '#0B1229',
            inverted: '#030712',
            muted: '#172554',
            subtle: '#d1d5db',
          },
          content: {
            DEFAULT: '#d1d5db',
            emphasis: '#e5e7eb',
            inverted: '#000000',
            strong: '#f9fafb',
            subtle: '#d1d5db',
          },
          ring: {
            DEFAULT: '#252525',
          },
        },
        tremor: {
          background: {
            DEFAULT: '#ffffff',
            emphasis: '#374151',
            muted: '#f9fafb',
            subtle: '#f3f4f6',
          },
          border: {
            DEFAULT: '#e5e7eb',
          },
          brand: {
            DEFAULT: '#111827',
            emphasis: '#252525',
            faint: '#eff6ff',
            inverted: '#ffffff',
            muted: '#bfdbfe',
            subtle: '#60a5fa',
          },
          content: {
            DEFAULT: '#6b7280',
            emphasis: '#374151',
            inverted: '#ffffff',
            strong: '#111827',
            subtle: '#9ca3af',
          },
          ring: {
            DEFAULT: '#e5e7eb',
          },
        },
      },
      fontSize: {
        'tremor-default': ['0.875rem', {lineHeight: '1.25rem'}],
        'tremor-label': '0.75rem',
        'tremor-metric': ['1.875rem', {lineHeight: '2.25rem'}],
        'tremor-title': ['1.125rem', {lineHeight: '1.75rem'}],
      },
    },
    transparent: 'transparent',
  },
};
export default config;
