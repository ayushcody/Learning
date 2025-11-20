/**
 * React Application Entry Point
 * 
 * This file bootstraps the React application and renders the root App component.
 * It sets up React 18's createRoot API for optimal performance.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

