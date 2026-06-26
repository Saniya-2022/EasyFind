import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server:{
    host: '0.0.0.0',
    port:3109,
    allowedHosts: [
      '127.0.0.1', // or 'localhost' - Important for dev server access
      'dev-easyfind.vjstartup.com',  // Add this line!
      'easyfind.vjstartup.com',  // Add this line!
      '103.248.208.119' 
      
    ],
    strictPort: true
  }
})
