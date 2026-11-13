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
        background: '#030712',
        surface: {
          50: '#070e1e',
          100: '#091328',
          200: '#0c1834',
          300: '#102046',
          card: '#080e1c',
        },
        navy: {
          950: '#02050f',
          900: '#040b1b',
          850: '#071128',
          800: '#0a1736',
          700: '#0e214d',
          600: '#153275',
          500: '#1d4ed8',
          glow: '#2563eb',
          electric: '#38bdf8',
        },
        constella: {
          blue: '#1d4ed8',
          accent: '#3b82f6',
          cyan: '#38bdf8',
          ice: '#e0f2fe',
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.05) 1px, transparent 1px)",
        'grid-subtle': "linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
        'radial-navy': "radial-gradient(circle at 50% 0%, rgba(30, 58, 138, 0.22) 0%, rgba(15, 23, 42, 0.05) 55%, transparent 80%)",
        'radial-corner': "radial-gradient(circle at 100% 100%, rgba(56, 189, 248, 0.12) 0%, transparent 50%)",
      },
      boxShadow: {
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(59, 130, 246, 0.15)',
        'glass-card-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.8), 0 0 30px -5px rgba(37, 99, 235, 0.35), inset 0 1px 0 0 rgba(96, 165, 250, 0.4)',
        'neon-glow': '0 0 25px rgba(37, 99, 235, 0.45)',
        'pill-glow': '0 0 15px rgba(56, 189, 248, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-spin': 'spin 14s linear infinite',
      },
    },
  },
  plugins: [],
};
