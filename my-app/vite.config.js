
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
 
export default defineConfig({
  plugins: [react()],
  // sockjs-client (used for the real-time WebSocket connection) expects
  // Node's `global` to exist, which the browser doesn't have. This maps
  // it to `globalThis` so it works in Vite's dev server and build.
  define: {
    global: 'globalThis',
  },
})
 
