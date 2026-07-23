import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  // react-simple-maps is an old CJS package that calls require('prop-types') internally;
  // forcing it into Vite's dep pre-bundling converts that to a real ESM import instead of
  // a runtime `require()` call the browser can't satisfy.
  optimizeDeps: {
    include: ['prop-types', 'react-simple-maps'],
  },
})
