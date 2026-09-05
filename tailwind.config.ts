import type { Config } from 'tailwindcss'

/**
 * Design system: "Mosaic Grid Architecture"
 * Forest green primary, paper-toned surfaces, hairline borders,
 * monospaced labels for data, structural grid, zero decoration.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-2': 'rgb(var(--ink-2) / <alpha-value>)',
        'ink-3': 'rgb(var(--ink-3) / <alpha-value>)',
        forest: 'rgb(var(--forest) / <alpha-value>)',
        'forest-2': 'rgb(var(--forest-2) / <alpha-value>)',
        'forest-dim': 'rgb(var(--forest-dim) / <alpha-value>)',
        clay: 'rgb(var(--clay) / <alpha-value>)',
        'clay-dim': 'rgb(var(--clay-dim) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        'danger-dim': 'rgb(var(--danger-dim) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        'info-dim': 'rgb(var(--info-dim) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '8px',
        lg: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,60,43,0.04)',
        lift: '0 4px 16px rgba(26,60,43,0.08)',
        pop: '0 12px 40px rgba(26,60,43,0.16)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.25s ease both',
        'slide-in': 'slide-in 0.2s ease both',
      },
    },
  },
  plugins: [],
}

export default config
