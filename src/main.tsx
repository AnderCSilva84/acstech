import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// Se um deploy trocar os nomes dos bundles enquanto uma aba está aberta,
// recarrega uma única vez para buscar o HTML da versão atual.
window.addEventListener('vite:preloadError', event => {
  event.preventDefault();
  const key = 'acs-chunk-reload';
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, 'true');
    window.location.reload();
  }
});
window.addEventListener('load', () => sessionStorage.removeItem('acs-chunk-reload'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>,
);
