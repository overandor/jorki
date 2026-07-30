// Central backend base URL for the whole app.
//
//   ''  (default)  -> same-origin. In dev, vite.config.js proxies the API paths
//                     to your local backend (VITE_API_TARGET, default :8000).
//   VITE_API_BASE  -> set at build time to point the DEPLOYED site at a backend,
//                     e.g. in Cloudflare Pages:  VITE_API_BASE=https://your-backend.example.com
//
// One knob wires every component + the useJorkiApi hook.
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''
