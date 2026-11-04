import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3525cd",
        "primary-container": "#4f46e5",
        "on-primary": "#ffffff",
        "on-primary-container": "#dad7ff",
        "primary-fixed": "#e2dfff",
        "primary-fixed-dim": "#c3c0ff",
        "on-primary-fixed": "#0f0069",
        secondary: "#006591",
        "secondary-container": "#39b8fd",
        "secondary-fixed": "#c9e6ff",
        "secondary-fixed-dim": "#89ceff",
        "on-secondary-container": "#004666",
        tertiary: "#571ac0",
        "tertiary-container": "#6f3dd9",
        "tertiary-fixed": "#e9ddff",
        "on-tertiary": "#ffffff",
        surface: "#faf8ff",
        "surface-bright": "#faf8ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f4f2fb",
        "surface-container": "#eeecf5",
        "surface-container-high": "#e8e6f0",
        "surface-container-highest": "#e2e1ea",
        "on-surface": "#1b1b1f",
        "on-surface-variant": "#464650",
        outline: "#767681",
        "outline-variant": "#c7c5d0",
        background: "#faf8ff",
        "on-background": "#1b1b1f",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

