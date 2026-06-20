import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f2a3f",
        mist: "#5b7c93",
        sea: {
          50: "#f0f8fb",
          100: "#daeef5",
          200: "#b6dde9",
          300: "#84c4d8",
          400: "#4ba3c0",
          500: "#2f87a6",
          600: "#296d8c",
          700: "#275a73",
          800: "#284c60",
          900: "#264052",
        },
        teal: {
          400: "#3fc7c0",
          500: "#22a7a0",
        },
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(16, 42, 63, 0.08)",
        card: "0 4px 24px rgba(16, 42, 63, 0.06)",
        glow: "0 0 40px rgba(63, 199, 192, 0.25)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "pulse-soft": "pulse-soft 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
