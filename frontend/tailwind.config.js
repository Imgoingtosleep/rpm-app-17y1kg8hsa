/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F0F11',
          card: '#16161E',
          border: '#22222E',
          accent: '#2A2B3D'
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5'
        }
      }
    },
  },
  plugins: [],
}
