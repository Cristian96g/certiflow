/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        line: "#dbe4f0",
        accent: "#0f766e",
        accentSoft: "#ccfbf1",
        sand: "#fffaf0",
      },
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: ["Segoe UI", "Tahoma", "Geneva", "Verdana", "sans-serif"],
      },
    },
  },
  plugins: [],
};
