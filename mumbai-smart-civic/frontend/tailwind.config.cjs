/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      keyframes: {
        authFade: {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(24px, -20px) scale(1.08)' },
          '66%': { transform: 'translate(-16px, 12px) scale(0.94)' },
        },
      },
      animation: {
        authFade: 'authFade 700ms ease-out both',
        blob: 'blob 16s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
