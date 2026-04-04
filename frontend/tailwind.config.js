export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        surface: "#0c0c0f",
        "surface-elevated": "#141418",
        panel: "#1a1a1f",
        "panel-hover": "#222228",
        border: "#2a2a32",
        "border-subtle": "#1e1e24",
        accent: "#8b5cf6",
        "accent-hover": "#a78bfa",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
        "card-hover": "0 8px 32px -8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        glow: "0 0 40px -8px rgba(139, 92, 246, 0.35)",
      },
    },
  },
  plugins: [],
};
