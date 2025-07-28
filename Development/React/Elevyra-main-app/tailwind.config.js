/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        primary: "#101010",
        primaryGray: "#1E1D1C",
        primaryWhite: "#f2f2f2",
        secondaryWhite: "#979797",
      },
      fontFamily:{
        karla: [ "Karla", "sans-serif"],
      }
    },
  },
  plugins: [],
}

