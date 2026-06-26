import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  server:{
    host: '0.0.0.0',
    port: 3111,
    allowedHosts: [
      '127.0.0.1', // or 'localhost' - Important for dev server access
      'dev-easyfind-admin.vjstartup.com',
      'easyfind-admin.vjstartup.com',
      '103.248.208.119'
    ],
    strictPort: true

  }
})
