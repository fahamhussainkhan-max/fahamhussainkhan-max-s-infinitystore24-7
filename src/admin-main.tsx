import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AdminStandaloneApp } from './AdminStandaloneApp';

const rootElement = document.getElementById('admin-root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AdminStandaloneApp />
    </StrictMode>
  );
}
