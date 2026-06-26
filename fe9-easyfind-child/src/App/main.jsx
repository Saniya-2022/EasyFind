import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "569225906668-vrjof0n4odj5kmibl6dg072o23r35ege.apps.googleusercontent.com";
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <React.StrictMode>
     <GoogleOAuthProvider clientId={clientId}>
    <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
