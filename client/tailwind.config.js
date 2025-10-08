/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2E7D32',
          dark: '#1B5E20',
          light: '#66BB6A',
        },
        secondary: {
          DEFAULT: '#1565C0',
          light: '#42A5F5',
        },
      },
    },
  },
  plugins: [],
};
