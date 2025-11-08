import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);

const render = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (typeof Office !== 'undefined' && Office.onReady) {
  Office.onReady()
    .then(render)
    .catch((error) => {
      console.error('Office failed to initialize', error);
      render();
    });
} else {
  render();
}
