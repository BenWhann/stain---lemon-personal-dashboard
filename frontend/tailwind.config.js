/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        cozy: ['"Quicksand"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        cat: {
          50: '#fff8f1',
          100: '#feeedc',
          200: '#fddab9',
          300: '#fcbe86',
          400: '#fa9d52',
          500: '#f67824',
          600: '#e75b16',
          700: '#bf4313',
          800: '#983617',
          900: '#7b2f17',
          950: '#42140a',
        },
        lemon: {
          canvas: '#FAF6F0',
          card: '#FFFFFF',
          subcard: '#FFF8F1',
          border: '#F2E8DC',
          text: '#2D2824',
          muted: '#7A6E65',
          accent: '#F67824',
        },
        stain: {
          void: '#151318',
          card: '#1E1B24',
          subcard: '#272330',
          border: '#383242',
          text: '#F4F1EA',
          muted: '#9E97A6',
          accent: '#F67824',
        },
      },
      boxShadow: {
        'cozy': '0 4px 20px -2px rgba(246, 120, 36, 0.08)',
        'cozy-lg': '0 10px 30px -4px rgba(246, 120, 36, 0.12)',
        'stain': '0 4px 24px -2px rgba(0, 0, 0, 0.45)',
        'stain-glow': '0 0 15px -2px rgba(246, 120, 36, 0.15)',
      },
      animation: {
        'float-paw': 'floatPaw 0.8s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        floatPaw: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '1' },
          '100%': { transform: 'translateY(-35px) scale(1.2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
