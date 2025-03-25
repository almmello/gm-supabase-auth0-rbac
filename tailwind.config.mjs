/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores Primárias
        'deep-navy': '#374161',
        'dark-slate': '#293047',
        'blue-light': '#6374AD',
        'blue-lighter': '#879FED',
        'blue-gray': '#3F4A6E',
        
        // Cores Secundárias
        'mint': '#71b399',
        'gray-light': '#dbe2ea',
        'gray-lighter': '#eaf0f5',
        'cream': '#E6E0D3',
        'cream-light': '#E2DBCD',
        
        // Cores Terrosas
        'burgundy': '#562632',
        'brown': '#856968',
        'cream-dark': '#FCF7E4',
        'dark-brown': '#29212C',
        'navy': '#192639',
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
      },
      backgroundImage: {
        'logo': 'url("/images/goalmoon-logo.png")',
        'logo-small': 'url("/images/goalmoon-logo-small.png")',
      },
    },
  },
  plugins: [],
};
