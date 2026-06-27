/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Canvas ──────────────────────────────────────────────
        canvas: {
          DEFAULT: "#080b11",   // Deep Slate / main background
          surface: "#0d111b",   // Sidebar / card surface
          elevated: "#111827",  // Slightly elevated surfaces
        },
        // ── Accent ──────────────────────────────────────────────
        brand: {
          orange: "#f97316",    // Primary CTA
          amber:  "#f59e0b",    // Gradient end
          blue:   "#3b82f6",    // Info accent
        },
        // ── Legacy aliases (keep for existing page.tsx) ──────────
        primary: {
          DEFAULT: "#0f172a",
          light:   "#1e293b",
          dark:    "#020617",
        },
        accent: {
          orange: "#ea580c",
          blue:   "#2563eb",
        },
      },
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":   "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient":   "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
        "brand-gradient":   "linear-gradient(135deg, #f97316, #f59e0b)",
      },
      boxShadow: {
        glass:         "0 8px 32px 0 rgba(0,0,0,0.37)",
        "glass-border":"inset 0 1px 0 0 rgba(255,255,255,0.1)",
        "brand-glow":  "0 0 24px rgba(249,115,22,0.25)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-out",
        "slide-up":   "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
