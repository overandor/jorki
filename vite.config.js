import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The UI calls the backend same-origin (API_BASE=''). In dev, proxy those API
// paths to the local Jorki backend (backend/app.py on :8000) so `npm run dev`
// and `uvicorn app:app` work together end-to-end. Override the target with
// VITE_API_TARGET when the backend runs elsewhere.
const API_TARGET = process.env.VITE_API_TARGET || 'http://127.0.0.1:8000'
const API_PATHS = [
  '/health', '/files', '/meta', '/summary', '/capabilities', '/superpose',
  '/stats', '/search', '/chunk', '/query', '/index', '/revoke',
]

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: Object.fromEntries(
      API_PATHS.map((p) => [p, { target: API_TARGET, changeOrigin: true }])
    ),
  },
})
