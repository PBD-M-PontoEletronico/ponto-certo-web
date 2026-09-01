/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1F2430',
        canvas: '#F7F7F5',
        surface: '#FFFFFF',
        border: '#E4E3DE',
        primary: {
          DEFAULT: '#2B3A67',
          light: '#3E5089',
          dark: '#1C2748',
        },
        accent: {
          DEFAULT: '#C68A2E',
          light: '#E2A83B',
        },
        success: '#2F7A52',
        danger: '#B84234',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
