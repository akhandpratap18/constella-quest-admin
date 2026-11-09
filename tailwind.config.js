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
        background: '#040705',
        surface: {
          50: '#071109',
          100: '#0b190f',
          200: '#112517',
          300: '#193623',
        },
        emerald: {
           glow: '#10b981',
           neon: '#00f59b',
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, rgba(16, 185, 129, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.07) 1px, transparent 1px)",
        'radial-emerald': "radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.05) 50%, transparent 80%)",
        'radial-corner': "radial-gradient(circle at 100% 100%, rgba(0, 245, 155, 0.12) 0%, transparent 50%)",
      },
      boxShadow: {
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(16, 185, 129, 0.2)',
        'glass-card-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.7), 0 0 25px -5px rgba(16, 185, 129, 0.3), inset 0 1px 0 0 rgba(52, 211, 153, 0.4)',
        'neon-glow': '0 0 20px rgba(16, 185, 129, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-spin': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
};
