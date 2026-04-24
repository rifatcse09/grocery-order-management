/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FF5C35",
          dark: "#1A1A1A",
          muted: "#6B7280",
          surface: "#F3F4F6",
        },
        accent: {
          DEFAULT: "#2563EB",
          soft: "#EFF6FF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        bn: ["Noto Sans Bengali", "Hind Siliguri", "Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 3px rgb(0 0 0 / 0.06), 0 8px 24px rgb(0 0 0 / 0.04)",
      },
    },
  },
  plugins: [],
};
