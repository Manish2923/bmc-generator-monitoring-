/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bw: {
          950: '#000000', // pure black canvas
          900: '#0a0a0a', // deep surface
          850: '#121212', // card surface
          800: '#181818', // card elevated / hover
          700: '#262626', // borders
          600: '#333333', // bright borders
          500: '#525252',
          400: '#737373', // muted text
          300: '#a3a3a3', // secondary text
          200: '#d4d4d4', // light text
          100: '#f5f5f5', // headings
          50: '#ffffff',  // pure white
        },
        status: {
          running: '#22c55e', // green
          runningBg: 'rgba(34, 197, 94, 0.12)',
          stopped: '#737373', // gray
          stoppedBg: 'rgba(115, 115, 115, 0.15)',
          warning: '#eab308', // amber
          warningBg: 'rgba(234, 179, 8, 0.15)',
          fault: '#ef4444', // red
          faultBg: 'rgba(239, 68, 68, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(38, 38, 38, 0.8)',
        'card-hover': '0 8px 30px -4px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.25)',
        'white-glow': '0 0 20px -3px rgba(255, 255, 255, 0.25)',
        'green-glow': '0 0 15px -2px rgba(34, 197, 94, 0.4)',
      },
    },
  },
  plugins: [],
}
