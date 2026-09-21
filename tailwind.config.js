/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],

  theme: {
    extend: {
      colors: {
        /* ===== Backgrounds ===== */
        base: "#F8FAFC",
        panel: "#FFFFFF",
        card: "#FFFFFF",
        cardhover: "#F8FAFC",

        /* ===== Borders ===== */
        line: "#E2E8F0",
        lineStrong: "#CBD5E1",

        /* ===== Typography ===== */
        ink: "#0F172A",
        muted: "#64748B",
        faint: "#94A3B8",

        /* ===== Brand ===== */
        signal: "#10B981",
        signalDim: "#059669",

        /* ===== Status Colors ===== */
        destroyed: "#EF4444",
        severe: "#F97316",
        moderate: "#F59E0B",
        minor: "#22C55E",
        info: "#3B82F6",

        /* ===== Extra UI Colors ===== */
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        primary: "#10B981",
        secondary: "#3B82F6",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },

      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },

      boxShadow: {
        rail: "0 1px 2px rgba(15,23,42,0.04)",

        card:
          "0 4px 20px rgba(15,23,42,0.06)",

        hover:
          "0 12px 32px rgba(15,23,42,0.10)",

        soft:
          "0 2px 8px rgba(15,23,42,0.05)",

        xl:
          "0 18px 45px rgba(15,23,42,0.08)",
      },

      transitionDuration: {
        250: "250ms",
        350: "350ms",
      },

      animation: {
        float: "float 3s ease-in-out infinite",
        fade: "fade .4s ease",
      },

      keyframes: {
        float: {
          "0%,100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-5px)",
          },
        },

        fade: {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
      },
    },
  },

  plugins: [],
};