import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  safelist: [
    // Notification system: solid backgrounds
    'bg-add-green', 'bg-add-yellow', 'bg-add-purple', 'bg-add-blue', 'bg-add-red', 'bg-add-orange',
    // Notification system: text colors
    'text-add-green', 'text-add-yellow', 'text-add-purple', 'text-add-blue', 'text-add-red', 'text-add-orange',
    // Notification system: tint backgrounds (10% opacity)
    'bg-add-green/10', 'bg-add-yellow/10', 'bg-add-purple/10', 'bg-add-blue/10', 'bg-add-red/10', 'bg-add-orange/10',
    // Notification system: borders (40% opacity)
    'border-add-green/40', 'border-add-yellow/40', 'border-add-purple/40', 'border-add-blue/40', 'border-add-red/40', 'border-add-orange/40',
    // Checklist color borders & backgrounds
    'border-l-add-red', 'border-l-add-orange', 'border-l-add-blue', 'border-l-add-green',
    'bg-add-red/5', 'bg-add-orange/5', 'bg-add-blue/5', 'bg-add-green/5',
    // Alert & badge borders
    'border-add-red/50', 'border-add-orange/50', 'border-add-yellow', 'border-add-blue', 'border-add-red', 'border-add-orange',
    // Walkthrough buttons
    'bg-add-orange/10', 'bg-add-orange/20',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "system-ui",
          "sans-serif",
        ],
      },
      letterSpacing: {
        fog: "0.15em",
        "fog-wide": "0.2em",
      },
      fontSize: {
        "fog-nav": ["10px", { lineHeight: "1.5", letterSpacing: "0.15em" }],
        "fog-body": ["11px", { lineHeight: "1.6", letterSpacing: "0.05em" }],
        "fog-heading": ["12px", { lineHeight: "1.4", letterSpacing: "0.15em" }],
      },
      colors: {
        add: {
          green: "#62bb47",
          yellow: "#fcb827",
          purple: "#7c3aed",
          blue: "#009ddc",
          red: "#e03a3c",
          orange: "#f6821f",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "var(--radius)",
        sm: "var(--radius)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
