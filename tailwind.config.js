/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        /* Surfaces */
        void: '#0A0B0D',
        surface: {
          DEFAULT: '#0E0F11',
          raised: '#161719',
          elevated: '#1E1F23',
          input: '#1A1B1F',
        },
        warm: {
          DEFAULT: '#F5EDE4',
          deep: '#E8D9C8',
          cream: '#FFF9F2',
        },
        /* Accents */
        copper: {
          DEFAULT: '#C4784A',
          light: '#D4895B',
          glow: 'rgba(196, 120, 74, 0.25)',
        },
        teal: {
          DEFAULT: '#1A6B5C',
          light: '#2D8B6F',
        },
        amber: '#D4A03C',
        err: '#C4534A',
        /* Text */
        ink: {
          DEFAULT: '#E8E4E0',
          muted: '#9A9590',
          faint: '#5A5550',
          dark: '#1C1C1E',
        },
        /* Borders & Glass */
        edge: {
          DEFAULT: '#2A2B2F',
          active: 'rgba(196, 120, 74, 0.25)',
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.12)',
        },
      },
      borderRadius: {
        sharp: '4px',
        panel: '16px',
        card: '20px',
      },
      keyframes: {
        reveal: {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        drawCheck: {
          from: { strokeDashoffset: '100' },
          to: { strokeDashoffset: '0' },
        },
        pulseRing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '0.5' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(64px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        reveal: 'reveal 0.85s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'slide-down': 'slideDown 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fadeIn 1.1s ease both',
        'draw-check': 'drawCheck 0.6s ease-out forwards',
        'pulse-ring': 'pulseRing 2s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.7s ease-out both',
      },
    },
  },
  plugins: [],
}
