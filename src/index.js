import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';  // ← THIS LINE MUST EXIST!
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);