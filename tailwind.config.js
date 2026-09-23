/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc5fb",
          400: "#36a6f6",
          500: "#0c8ce9",
          600: "#026fc7",
          700: "#0358a1",
          800: "#074b85",
          900: "#0c3f6e",
          950: "#082849",
        },
      },
    },
  },
  plugins: [],
}
