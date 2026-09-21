/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0B0E14",
        panel: "#131722",
        card: "#1C2230",
        cardhover: "#222838",
        line: "rgba(255,255,255,0.08)",
        lineStrong: "rgba(255,255,255,0.14)",
        ink: "#E7EAF2",
        muted: "#8B93A7",
        faint: "#5B6478",
        signal: "#FF6B35",
        signalDim: "#C9501F",
        destroyed: "#E13838",
        severe: "#F0883E",
        moderate: "#E8C547",
        minor: "#4ADE80",
        info: "#7DD3E8"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        rail: "1px 0 0 rgba(255,255,255,0.06)"
      }
    }
  },
  plugins: []
};