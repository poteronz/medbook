export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e0f5f2", 100: "#b3e8e2", 200: "#80d8ce",
          300: "#4dc8ba", 400: "#26baa9", 500: "#0a9b8c",
          600: "#0a8c7d", 700: "#076457", 800: "#044840", 900: "#022e28",
        },
      },
      fontFamily: { sans: ["Manrope", "system-ui", "sans-serif"], serif: ["Playfair Display", "serif"] },
      borderRadius: { "2xl": "16px", "3xl": "20px" },
    },
  },
  plugins: [],
};
