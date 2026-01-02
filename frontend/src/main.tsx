import React from 'react';
import ReactDOM from 'react-dom/client';
import { sdk } from '@farcaster/miniapp-sdk';
import App from './App';
import './index.css';

sdk.actions.ready({}).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

