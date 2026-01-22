/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./dashboard.html",
    "./popup.html",
    "./onboarding.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // 1. Typography (From 'typography.fontFamily')
    fontFamily: {
      sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
    },
    
    extend: {
      // 2. Palette & Semantic Colors
      colors: {
        neutral: {
          0: "#000000",
          50: "#050607",
          100: "#080A0B",
          150: "#0B0E10",
          200: "#101417",
          250: "#151B1F",
          300: "#1B242A",
          350: "#223038",
          400: "#2C3C46",
          500: "#3E515D",
          600: "#5A6E7B",
          700: "#7F92A0",
          800: "#A8B6C0",
          900: "#D6DEE3",
          1000: "#FFFFFF"
        },
        accentMint: {
          500: "#4DFFBC",
          600: "#79FFD0",
          700: "#A5FFE2"
        },
        // Semantic Mappings
        bg: {
          canvas: "#050607",     // neutral.50
          canvasAlt: "#080A0B",  // neutral.100
        },
        surface: {
          sidebar: "#080A0B",    // neutral.100
          base: "#0B0E10",       // neutral.150
          card: "#101417",       // neutral.200
          cardAlt: "#151B1F",    // neutral.250
          popover: "#151B1F",    // neutral.250
          inset: "#0B0E10",      // neutral.150
        },
        border: {
          subtle: "rgba(214,222,227,0.12)",
          default: "rgba(214,222,227,0.18)",
          strong: "rgba(214,222,227,0.26)",
          accent: "rgba(77,255,188,0.38)",
        },
        text: {
          primary: "rgba(255,255,255,0.92)",
          secondary: "rgba(255,255,255,0.78)",
          muted: "rgba(255,255,255,0.64)",
          disabled: "rgba(255,255,255,0.44)",
          onAccent: "#000000",
        },
        icon: {
          primary: "rgba(255,255,255,0.86)",
          secondary: "rgba(255,255,255,0.72)",
          muted: "rgba(255,255,255,0.58)",
          accent: "#4DFFBC",
        },
        accent: {
          primary: "#4DFFBC",
          primaryHover: "#79FFD0",
          primaryPressed: "#4DFFBC",
          softBg: "rgba(77,255,188,0.14)",
          glow: "rgba(77,255,188,0.22)",
        },
        state: {
          hover: "rgba(255,255,255,0.07)",
          pressed: "rgba(255,255,255,0.11)",
          focusRing: "rgba(77,255,188,0.30)",
        }
      },
      // 3. Radius
      borderRadius: {
        sm: "12px",
        md: "16px",
        lg: "22px",
        xl: "28px",
        pill: "999px",
      },
      // 4. Shadows
      boxShadow: {
        card: "0 14px 38px rgba(0,0,0,0.42)",
        cardSoft: "0 10px 26px rgba(0,0,0,0.32)",
        popover: "0 18px 60px rgba(0,0,0,0.55)",
        glowAccent: "0 0 0 1px rgba(77,255,188,0.16), 0 0 26px rgba(77,255,188,0.14)",
      },
      // 5. Typography Scale (Custom Utilities)
      fontSize: {
        'h1': ['36px', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '750' }],
        'h2': ['22px', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h3': ['18px', { lineHeight: '1.28', letterSpacing: '-0.005em', fontWeight: '650' }],
        'body': ['15px', { lineHeight: '1.55', letterSpacing: '0', fontWeight: '500' }],
        'small': ['13px', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '500' }],
        'label': ['12px', { lineHeight: '1.2', letterSpacing: '0.03em', fontWeight: '650' }],
        'metric': ['34px', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '800' }],
      }
    },
  },
  plugins: [],
}