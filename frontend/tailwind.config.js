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
        pane: '1.25rem',
        card: '0.875rem',
        field: '0.75rem',
      },
      boxShadow: {
        pane: '0 20px 50px -15px rgb(var(--shadow) / 0.45), 0 1px 0 0 rgb(255 255 255 / 0.14) inset',
        card: '0 2px 8px -2px rgb(var(--shadow) / 0.12), 0 1px 2px 0 rgb(var(--shadow) / 0.08)',
        glow: '0 0 0 1px rgb(var(--honey) / 0.35), 0 0 24px -4px rgb(var(--honey) / 0.45)',
        lift: '0 10px 25px -8px rgb(var(--shadow) / 0.4), 0 1px 0 0 rgb(255 255 255 / 0.15) inset',
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
