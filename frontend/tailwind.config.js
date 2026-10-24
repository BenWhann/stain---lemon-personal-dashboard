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
        pane: '1.75rem',
      },
      boxShadow: {
        pane: '0 30px 60px -20px rgb(var(--shadow) / 0.55), 0 1px 0 0 rgb(255 255 255 / 0.06) inset',
        glow: '0 0 0 1px rgb(var(--honey) / 0.35), 0 0 28px -4px rgb(var(--honey) / 0.55)',
        lift: '0 12px 30px -12px rgb(var(--shadow) / 0.6)',
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
