/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        accent: "#7c9dff",
        accent2: "#22a06b",
        warn: "#e0533d"
      }
    }
  },
  plugins: []
}
