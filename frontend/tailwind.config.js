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
        primary: '#1e3a8a', // Vignan Navy Blue
        'primary-hover': '#1e40af', 
        secondary: '#f59e0b', // Amber/Gold accent
        'secondary-hover': '#d97706',
        surface: '#ffffff',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      }
    },
  },
  plugins: [],
}
