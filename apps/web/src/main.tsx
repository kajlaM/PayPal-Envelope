// React + Vite dashboard (Step 13)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { App } from './App.tsx';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule]);

// Bryntum Enterprise license (BRYNTUM_LICENSE_KEY in the repo-root .env, passed in by vite.config.ts).
const w = window as unknown as { bryntum?: { licenseKey?: string } };
(w.bryntum ??= {}).licenseKey = import.meta.env.VITE_BRYNTUM_LICENSE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
