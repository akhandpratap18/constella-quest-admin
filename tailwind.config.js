/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#050608',
        surface: 'rgba(255, 255, 255, 0.03)',
        'surface-hover': 'rgba(255, 255, 255, 0.06)',
        border: 'rgba(255, 255, 255, 0.08)',
        'border-strong': 'rgba(255, 255, 255, 0.14)',
        'navy-900': '#0A1128',
        'navy-700': '#10265C',
        'blue-500': '#2F5BFF',
        'blue-400': '#5B8CFF',
        'blue-glow': 'rgba(47, 91, 255, 0.18)',
        'text-muted': '#9CA3AF',
        'text-dim': '#6B7280',
        navy: {
          950: '#03050c',
          900: '#0A1128',
          800: '#0d1a42',
          700: '#10265C',
          600: '#1c3fa3',
          500: '#2F5BFF',
          400: '#5B8CFF',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Geist Mono', 'monospace'],
      },
      boxShadow: {
        'glass-panel': 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.5)',
        'glass-panel-hover': 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 24px 70px rgba(0, 0, 0, 0.6), 0 0 30px rgba(47, 91, 255, 0.18)',
        'cta-glow': '0 8px 30px rgba(47, 91, 255, 0.35)',
        'pill-glow': '0 0 24px rgba(47, 91, 255, 0.25)',
      },
      animation: {
        'fade-up': 'fadeUp 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
