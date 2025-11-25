/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#000000",
          subtle: "#222222",
          panel: "#121212",
        },
        primary: {
          DEFAULT: "#ffffff",
          light: "#cccccc",
          dark: "#999999"
        },
        text: {
          DEFAULT: "#ffffff",
          subtle: "#bbbbbb",
          muted: "#888888",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["'Fira Code'", "'JetBrains Mono'", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

