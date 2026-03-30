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
        background: "#0B0F19",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#2563EB",
          light: "#3B82F6",
          dark: "#1D4ED8"
        },
        security: {
          DEFAULT: "#10B981",
          light: "#34D399",
          dark: "#059669"
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#F87171",
          dark: "#B91C1C"
        },
        surface: {
          DEFAULT: "#111827",
          border: "#1F2937"
        }
      },
    },
  },
  plugins: [],
};
export default config;
