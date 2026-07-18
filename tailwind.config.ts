import type { Config } from 'tailwindcss';

/**
 * AKTTOOLS V2 design tokens. This is the single source of truth for the premium look —
 * it will later become the design reference for the app redesign too. Tune the brand
 * palette here; every component reads from these tokens (no hard-coded colors in components).
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // AKT Red — the registered brand color (red badge logo). Primary action, brand, focus.
        brand: {
          DEFAULT: '#E4002B',
          50: '#FCE7EC',
          100: '#F7B8C4',
          400: '#FF3B5C', // legible red on ink/black surfaces
          600: '#E4002B',
          700: '#B80022', // hover / pressed
          900: '#7A0018',
        },
        ink: {
          DEFAULT: '#141210', // near-black, warm — the logo's black + drama bands/footer
          soft: '#5F5A55',
          muted: '#A39C94',
        },
        surface: {
          DEFAULT: '#ffffff',
          alt: '#FAF8F6', // warm paper ground
          border: '#ECE7E2',
        },
        danger: '#C1121F',
        success: '#141210', // in-stock shown neutral (palette stays red/black/white — no green)
        // Signal amber — the "workbench warning LED": dispatch cut-off + low-stock urgency only.
        signal: {
          DEFAULT: '#C67C09',
          ink: '#1a1205', // legible text on an amber chip
          soft: '#F4E7CE',
        },
      },
      fontFamily: {
        // Barlow (body) + Barlow Semi Condensed (display) — an industrial, license-plate grotesque
        // that rhymes with the logo's heavy condensed weight. Loaded via next/font.
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        // Instrument-readout numerics: prices, SKUs, stock counts, dispatch timer.
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.14em' }],
        display: ['clamp(2rem, 5vw, 3.25rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        hover: '0 6px 20px rgba(0,0,0,0.10)',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
