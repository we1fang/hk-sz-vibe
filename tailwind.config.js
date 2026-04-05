/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Orbitron", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: [
          "Rajdhani",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        cyber: {
          deep: "#0a0e27",
          panel: "#0f1538",
          border: "#1e2a5a",
          glow: "#a855f7",
          cyan: "#22d3ee",
        },
      },
      boxShadow: {
        neon: "0 0 20px rgba(168, 85, 247, 0.35), 0 0 40px rgba(34, 211, 238, 0.15)",
        "neon-sm": "0 0 12px rgba(168, 85, 247, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "card-refresh": "cardRefresh 0.45s ease-out",
      },
      keyframes: {
        cardRefresh: {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(0.94)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
