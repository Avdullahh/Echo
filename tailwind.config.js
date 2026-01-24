/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{tsx,ts,js,jsx}", 
    "./popup.html", 
    "./dashboard.html",
    "./onboarding.html"
  ],
  theme: {
    extend: {
      colors: {
        // "Echo Dark Accessible" Design Tokens
        bg: {
          canvas: '#0A0C0F',   // Deepest background
          base: '#101417',     // Standard background
        },
        surface: {
          card: '#161B22',     // Cards
          cardHover: '#1C2128', // Hover state
          cardAlt: '#1A1F26',  // Alternative card background
          inset: '#0D1117',    // Input fields / recessed areas
          glass: 'rgba(22, 27, 34, 0.7)', // Glassmorphism base
        },
        border: {
          default: '#30363D',  // Default border
          subtle: '#30363D',
          strong: '#8B949E',
          focus: '#4DFFBC',
        },
        neutral: {
          0: '#FFFFFF',        // Pure white
        },
        text: {
          primary: '#F0F6FC',  // High contrast white
          secondary: '#C9D1D9',
          muted: '#8B949E',
          disabled: '#6E7681', // Disabled text
          onAccent: '#010409', // Black text on neon buttons
        },
        icon: {
          muted: '#8B949E',    // Muted icon color
        },
        accent: {
          primary: '#4DFFBC',  // Neon Mint
          primaryHover: '#3DE5A8', // Neon Mint hover
          softBg: 'rgba(77, 255, 188, 0.1)', // Soft background glow
          secondary: '#2F81F7', // Action Blue
          critical: '#FF7B72', // Error Red
          warning: '#D2A106',  // Warning Yellow
          success: '#3FB950',  // Success Green
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h2': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }], // 30px
        'body': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'label': ['0.625rem', { lineHeight: '0.875rem', fontWeight: '600' }], // 10px
        'small': ['0.75rem', { lineHeight: '1rem' }], // 12px
      },
      boxShadow: {
        'glow': '0 0 20px rgba(77, 255, 188, 0.15)',
        'glowAccent': '0 0 20px rgba(77, 255, 188, 0.4)',
        'cardSoft': '0 4px 16px rgba(0, 0, 0, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #161B22 0deg, #0A0C0F 360deg)',
      }
    },
  },
  plugins: [],
}