import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Surface any unhandled errors to the console in full
window.addEventListener('error', (e) => {
  console.error('[DSP Lab] window error:', e.message, e.filename, e.lineno);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[DSP Lab] unhandled rejection:', e.reason);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
