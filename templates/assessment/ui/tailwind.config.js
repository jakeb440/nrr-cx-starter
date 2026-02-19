/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // McKinsey Typography
        display: ['Bower', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['McKinseySans', 'Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // McKinsey Brand Colors (from mckinsey.com)
        mck: {
          // Primary brand blue - vibrant electric blue for CTAs
          blue: '#2251FF',
          // Electric blue for hover states
          electric: '#0060FF',
          // Deep navy - primary dark background
          navy: '#051C2C',
          // Dark navy - secondary dark sections
          'dark-navy': '#0A2540',
        },
        // McKinsey Blue palette (shades)
        'mck-blue': {
          50: '#EEF3FF',
          100: '#DCE7FF',
          200: '#B9CFFF',
          300: '#96B7FF',
          400: '#5C8FFF',
          500: '#2251FF', // Primary McKinsey blue
          600: '#1A41CC',
          700: '#133199',
          800: '#0D2166',
          900: '#061033',
          950: '#03081A',
        },
        // Surface colors - light theme
        surface: {
          primary: '#ffffff',
          secondary: '#f7f7f7',
          tertiary: '#f1f3f4',
          border: '#e5e5e5',
          borderLight: '#eeeeee',
        },
        // Text colors
        text: {
          primary: '#051C2C',
          secondary: '#4a4a4a',
          tertiary: '#6b7280',
          muted: '#9ca3af',
        },
      },
      borderRadius: {
        'card': '22px',
        'pill': '9999px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'typing': 'typing 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      boxShadow: {
        'mck': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'mck-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'mck-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}