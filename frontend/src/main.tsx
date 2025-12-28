import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Entry point for Flappy Bird Base Mini App
 * 
 * This app runs inside the Base social app as a Mini App.
 * It connects to the user's Smart Wallet for on-chain interactions.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

