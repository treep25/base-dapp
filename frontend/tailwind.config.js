/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base brand colors
        'base-blue': '#0052FF',
        'base-blue-light': '#3385FF',
        'base-blue-glow': '#00D4FF',
        'base-dark': '#0A0B0D',
        'base-dark-light': '#1a1b26',
        // Game theme colors - modern style
        'game-sky': '#87CEEB',
        'game-sky-dark': '#4169E1',
        'game-bird': '#4FC3F7',
        'game-pipe': '#4CAF50',
      },
      fontFamily: {
        // Modern clean fonts for web3 style
        'sans': ['Inter', 'Poppins', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'display': ['Poppins', 'Inter', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-fast': 'pulse 0.5s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 82, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.5)' },
        },
      },
      boxShadow: {
        'glow-blue': '0 0 30px rgba(0, 82, 255, 0.4)',
        'glow-cyan': '0 0 30px rgba(0, 212, 255, 0.4)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
