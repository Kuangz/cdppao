import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntApp, ConfigProvider } from 'antd';
import './styles/index.css';
import 'antd/dist/reset.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import { BrowserRouter } from 'react-router-dom';
import { LocationProvider } from './contexts/LocationContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{ token: { fontFamily: 'Noto Sans Thai, sans-serif', fontSize: 16 } }}
    >
      <LocationProvider>
        <MessageProvider>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </MessageProvider>
      </LocationProvider>
    </ConfigProvider>
  </React.StrictMode>
);

reportWebVitals();
