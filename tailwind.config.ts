import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Color Tokens
        brand: {
          primary: '#0f2e5c',
          secondary: '#0284C7',
          accent: '#D97706',
        },
        // Dairy & Cream Theme
        dairy: {
          cream: '#FFFDF7',
          brown: {
            800: '#292524',
            600: '#57534E',
            400: '#A8A29E',
          },
        },
        // Milk color scale (dynamic via CSS variables)
        milk: {
          50: 'var(--milk-50, #F9F6F0)',
          100: 'var(--milk-100, #F0EAE1)',
          200: 'var(--milk-200, #E5DCD0)',
          300: 'var(--milk-300, #D5C8B8)',
          foam: 'var(--milk-foam, #F9F3E3)',
        },
        cream: {
          50: 'var(--cream-50, #FFFDF7)',
          100: 'var(--cream-100, #FFF8E8)',
          200: 'var(--cream-200, #FDEFC3)',
        },
        'warm-white': 'var(--warm-white, #FEFEFE)',
        border: 'var(--border, #E8DCC8)',
        shadow: 'var(--shadow, rgba(180, 140, 60, 0.12))',
      },
      fontFamily: {
        brand: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      boxShadow: {
        button: '0 4px 14px 0 rgba(15, 46, 92, 0.3)',
        amber: '0 4px 14px 0 rgba(217, 119, 6, 0.3)',
        card: '0 10px 30px -10px var(--shadow, rgba(180, 140, 60, 0.12))',
        'card-hover': '0 20px 40px -15px var(--shadow, rgba(180, 140, 60, 0.2))',
      },
      borderRadius: {
        'brand-sm': '8px',
        'brand-md': '14px',
        'brand-lg': '20px',
        'brand-xl': '24px',
        'brand-2xl': '28px',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wave: {
          '0%': { transform: 'rotate(0.0deg)' },
          '10%': { transform: 'rotate(14.0deg)' },
          '20%': { transform: 'rotate(-8.0deg)' },
          '30%': { transform: 'rotate(14.0deg)' },
          '40%': { transform: 'rotate(-4.0deg)' },
          '50%': { transform: 'rotate(10.0deg)' },
          '60%': { transform: 'rotate(0.0deg)' },
          '100%': { transform: 'rotate(0.0deg)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        float: 'float 4s ease-in-out infinite',
        wave: 'wave 2.5s infinite',
      },
    },
  },
  plugins: [],
}

export default config
