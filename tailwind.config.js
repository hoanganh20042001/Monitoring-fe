/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#e0f2fe', // xanh nhạt
          DEFAULT: '#3b82f6', // xanh chủ đạo
          dark: '#2563eb', // xanh đậm
        },
      },
    },
  },
  plugins: [],
};
