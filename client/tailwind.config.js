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
          indigo: '#4f46e5',
          gold: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
