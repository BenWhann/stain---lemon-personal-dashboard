/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces Variable"', 'Georgia', 'serif'],
        sans: ['"Figtree Variable"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Semantic tokens; values swap between Lemon Sunlight and Stain Nocturne in index.css
        ink: v('ink'),
        'ink-soft': v('ink-soft'),
        'ink-faint': v('ink-faint'),
        surface: v('surface'),
        'surface-strong': v('surface-strong'),
        line: v('line'),
        honey: v('honey'),
        'honey-deep': v('honey-deep'),
        caramel: v('caramel'),
        sage: v('sage'),
        blush: v('blush'),
        ember: v('ember'),
        night: v('night'),
      },
      borderRadius: {
        pane: '0.5rem',
        card: '0.375rem',
        field: '0.375rem',
      },
      boxShadow: {
        pane: '0 4px 20px -4px rgb(var(--shadow) / 0.18), 0 1px 2px 0 rgb(var(--shadow) / 0.08)',
        card: '0 1px 3px 0 rgb(var(--shadow) / 0.1), 0 1px 2px -1px rgb(var(--shadow) / 0.06)',
        glow: '0 0 0 1px rgb(var(--honey) / 0.35)',
        lift: '0 6px 16px -4px rgb(var(--shadow) / 0.22)',
      },
      transitionTimingFunction: {
        silk: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
