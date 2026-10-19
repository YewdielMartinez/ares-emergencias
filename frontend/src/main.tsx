import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@yewdiel21/motion-kit/react';
import '@yewdiel21/motion-kit/css';
import '@yewdiel21/motion-kit/css/themes';
import '@yewdiel21/motion-kit/css/fonts';
import App from './App';
import './map.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="orange">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
