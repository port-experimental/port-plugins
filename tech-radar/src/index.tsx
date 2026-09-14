import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('plugin-root');
if (!root) throw new Error('Missing #plugin-root');
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
