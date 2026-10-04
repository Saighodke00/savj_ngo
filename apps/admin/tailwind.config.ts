import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",
        secondary: "#334155",
        background: "#f8fafc",
        brand: {
          teal: "#00796B",
          "teal-light": "#00897B",
          "teal-dark": "#004D40",
          amber: "#f59e0b",
          dark: "#0f172a",
          sidebar: "#1e293b",
          card: "#1e293b",
          border: "#334155",
        },
      },
      backgroundImage: {
        "admin-gradient": "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
