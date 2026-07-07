/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        surface: "#121212",
        "surface-elevated": "#1A1A1A",
        "surface-nav": "#202020",
        accent: "#F06543",
      },
    },
  },
  plugins: [],
};
