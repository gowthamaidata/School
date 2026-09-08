import type { Config } from 'tailwindcss'

/**
 * Palli design system — "Softly, for school"
 *
 * A calm pastel system built for data-dense school screens: a warm off-white
 * ground, sage/lavender/sky/peach accents used for *meaning* rather than
 * decoration, generous but graded corner radii, and shadows that read as
 * light rather than weight.
 *
 * Every value here is driven by a CSS custom property declared in
 * `src/app/globals.css`, so light and dark themes swap by changing channels
 * in one place. Colours are stored as space-separated RGB channels so
 * Tailwind can compose opacity modifiers (`bg-mint/40`).
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Surfaces */
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',

        /* Structure */
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',

        /* Ink */
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-2': 'rgb(var(--ink-2) / <alpha-value>)',
        'ink-3': 'rgb(var(--ink-3) / <alpha-value>)',

        /* Semantic roles.
           `forest` (brand/positive), `clay` (attention), `danger`, `info` keep
           their historical names so every existing component keeps working —
           only the values moved to the pastel system. */
        forest: 'rgb(var(--forest) / <alpha-value>)',
        'forest-2': 'rgb(var(--forest-2) / <alpha-value>)',
        'forest-dim': 'rgb(var(--forest-dim) / <alpha-value>)',
        clay: 'rgb(var(--clay) / <alpha-value>)',
        'clay-dim': 'rgb(var(--clay-dim) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        'danger-dim': 'rgb(var(--danger-dim) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        'info-dim': 'rgb(var(--info-dim) / <alpha-value>)',
        leaf: 'rgb(var(--leaf) / <alpha-value>)',
        'leaf-dim': 'rgb(var(--leaf-dim) / <alpha-value>)',

        /* Readable text steps for label-sized type on the matching wash. */
        'forest-ink': 'rgb(var(--forest-ink) / <alpha-value>)',
        'leaf-ink': 'rgb(var(--leaf-ink) / <alpha-value>)',
        'clay-ink': 'rgb(var(--clay-ink) / <alpha-value>)',
        'danger-ink': 'rgb(var(--danger-ink) / <alpha-value>)',
        'info-ink': 'rgb(var(--info-ink) / <alpha-value>)',

        /* Pastel accent family — washes, chips, illustration */
        mint: 'rgb(var(--mint) / <alpha-value>)',
        lavender: 'rgb(var(--lavender) / <alpha-value>)',
        peach: 'rgb(var(--peach) / <alpha-value>)',
        sky: 'rgb(var(--sky) / <alpha-value>)',
        butter: 'rgb(var(--butter) / <alpha-value>)',
        blush: 'rgb(var(--blush) / <alpha-value>)',
      },

      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        /* Expressive metric sizes — used for the numbers that matter. */
        metric: ['1.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'metric-lg': ['2.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
      },

      /* Graded, intentional geometry: small controls stay crisp, containers
         get soft, and `pill` is reserved for chips, toggles and icon buttons. */
      borderRadius: {
        DEFAULT: '10px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '26px',
        '3xl': '34px',
        pill: '999px',
      },

      boxShadow: {
        /* Diffused and low-contrast — depth without heaviness. */
        card: '0 1px 2px rgba(60, 50, 90, 0.04), 0 4px 14px -8px rgba(60, 50, 90, 0.10)',
        lift: '0 2px 6px rgba(60, 50, 90, 0.05), 0 12px 28px -12px rgba(60, 50, 90, 0.18)',
        pop: '0 8px 20px rgba(60, 50, 90, 0.10), 0 28px 60px -24px rgba(60, 50, 90, 0.30)',
        inset: 'inset 0 1px 2px rgba(60, 50, 90, 0.05)',
        glow: '0 0 0 4px rgb(var(--forest) / 0.14)',
      },

      backdropBlur: {
        xs: '2px',
      },

      transitionTimingFunction: {
        /* One soft-overshoot curve for the whole product. */
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'soft-in': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.97) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'bounce-check': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'draw-in': {
          from: { strokeDashoffset: '1000' },
          to: { strokeDashoffset: '0' },
        },
        'grow-y': {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
      },

      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.25s ease both',
        'slide-in': 'slide-in 0.24s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.24s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        float: 'float 7s ease-in-out infinite',
        'bounce-check': 'bounce-check 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'draw-in': 'draw-in 1.1s cubic-bezier(0.22, 1, 0.36, 1) both',
        'grow-y': 'grow-y 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}

export default config
