import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 🔥 SPICY DARK THEME - Identité "Orange Bistro"
        background: {
          DEFAULT: '#121212', // Noir profond (charbon)
          surface: '#1E1E1E',  // Gris très foncé (cartes)
        },
        primary: {
          DEFAULT: '#FF7D29',  // Orange vibrant (appétit)
          50: '#FFF4ED',
          100: '#FFE8D9',
          200: '#FFCDB3',
          300: '#FFAD87',
          400: '#FF7D29',  // Main
          500: '#FF6B0A',
          600: '#E85A00',
          700: '#C04700',
          800: '#993800',
          900: '#7A2D00',
        },
        text: {
          primary: '#FFFFFF',    // Blanc pur
          secondary: '#A0A0A0',  // Gris argenté
          muted: '#6B6B6B',      // Gris foncé
        },
        // Couleurs fonctionnelles (compatibilité)
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#F44336',
        info: '#2196F3',
      },
      fontFamily: {
        // Typographie gourmande
        display: ['Oswald', 'Bebas Neue', 'Arial Black', 'sans-serif'], // Titres puissants
        sans: ['Lato', 'Inter', 'system-ui', 'sans-serif'],              // Corps de texte
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
