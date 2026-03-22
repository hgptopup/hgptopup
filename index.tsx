
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Suppress known Supabase auth errors that don't affect functionality
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = args[0];
  if (typeof msg === 'string' && msg.includes('Refresh Token')) return;
  if (msg && msg.message && msg.message.includes('Refresh Token')) return;
  originalConsoleError(...args);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
