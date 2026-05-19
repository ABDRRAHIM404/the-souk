/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:     "#E76F51",
        secondary:   "#2A9D8F",
        accent:      "#E9C46A",
        background:  "#FFFCF8",
        darkText:    "#1a1008",
        bodyText:    "#6b5a4e",
        muted:       "#9a8a7a",
        cardBg:      "#ffffff",
        border:      "#f0e8e0",
      },
      fontFamily: {
        heading: ['"Playfair Display"', "serif"],
        body:    ["system-ui", "sans-serif"],
      },
      borderRadius: {
        card:   "20px",
        btn:    "50px",
        input:  "12px",
      },
      boxShadow: {
        card:       "0 4px 24px rgba(0,0,0,0.06)",
        "card-hover": "0 12px 40px rgba(0,0,0,0.13)",
      },
    },
  },
  plugins: [],
};