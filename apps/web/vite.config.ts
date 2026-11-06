import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Reads the repo-root .env. Only VITE_* values reach the browser; the PayPal client id (public)
// falls back to PAYPAL_CLIENT_ID so local dev needs no extra setting.
const envDir = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');
  return {
    plugins: [react()],
    envDir,
    server: { port: 5173, strictPort: true }, // Zapier alert links point here (DASHBOARD_URL)
    define: {
      'import.meta.env.VITE_PAYPAL_CLIENT_ID': JSON.stringify(env.VITE_PAYPAL_CLIENT_ID || env.PAYPAL_CLIENT_ID || ''),
      'import.meta.env.VITE_BRYNTUM_LICENSE_KEY': JSON.stringify(env.BRYNTUM_LICENSE_KEY?.trim() || ''),
    },
  };
});
