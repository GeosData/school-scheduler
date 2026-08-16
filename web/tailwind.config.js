export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1e40af", dark: "#1a3691" },
        accent: { DEFAULT: "#16a34a", dark: "#15803d" },
        ink: "#16233d",
        muted: "#51607a",
        line: "#dde5f0",
        bg: "#f3f6fb",
        danger: "#dc2626",
      },
      fontFamily: {
        sans: ['"Lexend"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
