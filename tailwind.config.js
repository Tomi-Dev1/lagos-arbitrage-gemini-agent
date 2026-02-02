/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lagosYellow: '#FFD700',
        ekoBlack: '#000000',
        ekoGray: '#1a1a1a',
      }
    },
  },
  plugins: [],
}
