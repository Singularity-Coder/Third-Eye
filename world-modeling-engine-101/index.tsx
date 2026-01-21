
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("ENGINE_CORE: Booting sequence initiated.");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("CRITICAL_FAILURE: Root element not detected in DOM.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("ENGINE_CORE: Projection interface ready.");
  } catch (error) {
    console.error("ENGINE_CORE: Failed to mount application:", error);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; background: #050506; color: #ef4444; padding: 20px; text-align: center;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 48px; margin-bottom: 20px;"></i>
        <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">BOOT_SEQUENCE_FAILURE</h1>
        <p style="font-size: 12px; color: #94a3b8; font-family: monospace; max-width: 400px;">
          ${error instanceof Error ? error.message : 'Unknown kernel error occurred.'}
        </p>
      </div>
    `;
  }
}
