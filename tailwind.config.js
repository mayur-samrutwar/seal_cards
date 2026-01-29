/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'flip': 'flip 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-out': 'slideOut 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slideIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg) translateZ(0px)' },
          '50%': { transform: 'rotateY(90deg) translateZ(20px)' },
          '100%': { transform: 'rotateY(180deg) translateZ(0px)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0) translateY(0) rotate(0deg) scale(1)' },
          '100%': { transform: 'translateX(400px) translateY(-100px) rotate(15deg) scale(1.1)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(400px) translateY(-100px) rotate(15deg) scale(1.1)' },
          '100%': { transform: 'translateX(0) translateY(0) rotate(0deg) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
