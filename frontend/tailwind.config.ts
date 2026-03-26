import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "var(--color-paper)",
          dark:    "var(--color-paper-dark)",
          darker:  "var(--color-paper-darker)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          light:   "var(--color-ink-light)",
          faint:   "var(--color-ink-faint)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          light:   "var(--color-accent-light)",
          faint:   "var(--color-accent-faint)",
          dark:    "var(--color-accent-dark)",
        },
        error: {
          DEFAULT: "var(--color-error)",
          light:   "var(--color-error-light)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
      },
      fontFamily: {
        serif:     ["var(--font-serif)"],
        "serif-alt": ["var(--font-serif-alt)"],
        sans:      ["var(--font-sans)", "system-ui"],
        mono:      ["var(--font-mono)"],
      },
      boxShadow: {
        sm:   "var(--shadow-sm)",
        md:   "var(--shadow-md)",
        lg:   "var(--shadow-lg)",
        card: "var(--shadow-card)",
      },
      borderRadius: {
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      maxWidth: {
        content: "var(--max-width-content)",
        article: "var(--max-width-article)",
        narrow:  "var(--max-width-narrow)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
export default config;
