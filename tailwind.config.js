/** @type {import('tailwindcss').Config} */
module.exports = {
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
          inset: '#0D1117',    // Input fields / recessed areas
          glass: 'rgba(22, 27, 34, 0.7)', // Glassmorphism base
        },
        border: {
          subtle: '#30363D',
          strong: '#8B949E',
          focus: '#4DFFBC',
        },
        text: {
          primary: '#F0F6FC',  // High contrast white
          secondary: '#C9D1D9',
          muted: '#8B949E',
          onAccent: '#010409', // Black text on neon buttons
        },
        accent: {
          primary: '#4DFFBC',  // Neon Mint
          secondary: '#2F81F7', // Action Blue
          critical: '#FF7B72', // Error Red
          warning: '#D2A106',  // Warning Yellow
          success: '#3FB950',  // Success Green
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(77, 255, 188, 0.15)',
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