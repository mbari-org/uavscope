import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
    
console.log('Building with API URL:', process.env.VITE_TATOR_HOST);
console.log('Building with API Token:', process.env.VITE_TATOR_TOKEN);
console.log('Building with Box Type:', process.env.VITE_BOX_TYPE);
console.log('Building with Project ID:', process.env.VITE_PROJECT_ID);
console.log('Building with API Timeout:', process.env.VITE_API_TIMEOUT);
console.log('Building with Max Retries:', process.env.VITE_MAX_RETRIES);

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/scope/', // 👈 ensures assets resolve under /scope/
    server: {
      port: 3000,
      host: true, // Allow access from outside the container
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
  })