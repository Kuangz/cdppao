import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import "antd/dist/reset.css";
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from "./contexts/AuthContext";
import { MessageProvider } from './contexts/MessageContext';
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MessageProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </MessageProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
