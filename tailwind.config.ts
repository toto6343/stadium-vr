import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', '"Noto Sans KR"', 'sans-serif'],
        body: ['Barlow', '"Noto Sans KR"', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        flash: {
          '0%':   { opacity: '0.7' },
          '100%': { opacity: '0' },
        },
        livePulse: {
          '0%, 100%': { opacity: '1',  boxShadow: '0 0 0 0 rgba(255,45,45,0.5)' },
          '50%':       { opacity: '0.5', boxShadow: '0 0 0 5px rgba(255,45,45,0)' },
        },
        scorePop: {
          '0%':   { transform: 'scale(1.5)', opacity: '0' },
          '60%':  { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':    'fadeIn 0.3s ease forwards',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'flash':      'flash 0.7s ease-out forwards',
        'live-pulse': 'livePulse 1.8s ease-in-out infinite',
        'score-pop':  'scorePop 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'shimmer':    'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
