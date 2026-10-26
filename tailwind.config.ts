import type { Config } from "tailwindcss";

const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

function colorScale(cssPrefix: string) {
  return Object.fromEntries(
    steps.map((step) => [step, `var(--${cssPrefix}-${step})`])
  ) as Record<(typeof steps)[number], string>;
}

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        text: colorScale("text"),
        background: colorScale("background"),
        primary: colorScale("primary"),
        secondary: colorScale("secondary"),
        accent: colorScale("accent"),
        page: "var(--page-bg)",
        surface: "var(--surface-bg)",
        "surface-muted": "var(--surface-muted-bg)",
        divider: "var(--border-subtle)",
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgb(80 127 175 / 0.12)",
        card: "0 2px 12px -2px rgb(15 29 36 / 0.08)",
        "card-dark": "0 2px 16px -2px rgb(0 0 0 / 0.45)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
