/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#dce4fd',
          300: '#c2cffa',
          400: '#9eaff5',
          500: '#5a64e3', // Primary Indigo
          600: '#4a51cc',
          700: '#383c85',
          800: '#21234e',
          900: '#0f1021',
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};