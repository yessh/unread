/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 배경 계층
        surface: {
          base: '#0f0f13',
          card: '#1a1a24',
          elevated: '#252535',
        },
        // 브랜드 강조색
        accent: {
          primary: '#7c6af7',
          secondary: '#4fc3f7',
          success: '#4ade80',
          warning: '#fbbf24',
          danger: '#f87171',
        },
        // 텍스트 계층
        content: {
          primary: '#f1f1f5',
          secondary: '#a0a0b8',
          muted: '#5a5a78',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
        mono: ['monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 4px 24px 0 rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(124,106,247,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
