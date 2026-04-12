/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#eef3fb",
          100: "#d5e2f5",
          200: "#aec5eb",
          300: "#80a3de",
          400: "#5681d1",
          500: "#3d6ab5",
          600: "#3460a8",
          700: "#2a518e",
          800: "#224274",
          900: "#1a3459",
        },
        background: {
          light: "#ffffff",
          dark:  "#111827",
        },
        surface: {
          light: "#f3f4f6",
          dark:  "#1f2937",
        },
        foreground: {
          light: "#111827",
          dark:  "#f9fafb",
        },
      },
    },
  },
  plugins: [],
};
