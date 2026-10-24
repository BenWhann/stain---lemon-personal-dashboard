import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './art/art.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

if (import.meta.env.DEV && new URLSearchParams(location.search).has('lab')) {
  import('./dev/ArtLab').then(({ ArtLab }) => root.render(<ArtLab />));
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
