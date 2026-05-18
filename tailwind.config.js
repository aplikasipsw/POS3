/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#111827', // Premium Black
          gold: '#D4AF37', // Elegant Gold
          orange: '#EA580C', // Nasi Goreng Orange
          light: '#F3F4F6'
        }
      }
    },
  },
  plugins: [],
}
