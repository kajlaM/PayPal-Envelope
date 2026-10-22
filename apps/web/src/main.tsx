// React + Vite dashboard (Step 13)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { App } from './App.tsx';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
