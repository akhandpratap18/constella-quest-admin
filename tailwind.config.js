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
        background: '#000000',
        surface: {
          50: '#030714',
          100: '#050b1c',
          200: '#081028',
          300: '#0c1638',
          card: '#040816',
        },
        navy: {
          950: '#01040d',
          900: '#03081a',
          850: '#050f28',
          800: '#09173d',
          700: '#0d2259',
          600: '#143485',
          500: '#1d4ed8',
          glow: '#2563eb',
          royal: '#3b82f6',
        },
        constella: {
          blue: '#2563eb',
          royal: '#1d4ed8',
          accent: '#3b82f6',
          light: '#60a5fa',
          deep: '#0f172a',
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, rgba(59, 130, 246, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px)",
        'grid-subtle': "linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)",
        'radial-blue': "radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.3) 0%, rgba(29, 78, 216, 0.08) 50%, transparent 75%)",
        'radial-corner': "radial-gradient(circle at 100% 100%, rgba(37, 99, 235, 0.16) 0%, transparent 55%)",
      },
      boxShadow: {
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.8), inset 0 1px 0 0 rgba(59, 130, 246, 0.2), 0 0 20px -5px rgba(37, 99, 235, 0.2)',
        'glass-card-hover': '0 14px 45px 0 rgba(0, 0, 0, 0.9), 0 0 35px -5px rgba(37, 99, 235, 0.45), inset 0 1px 0 0 rgba(96, 165, 250, 0.45)',
        'neon-glow': '0 0 30px rgba(37, 99, 235, 0.55)',
        'pill-glow': '0 0 18px rgba(37, 99, 235, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-spin': 'spin 14s linear infinite',
      },
    },
  },
  plugins: [],
};
