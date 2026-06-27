import React, { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "569225906668-vrjof0n4odj5kmibl6dg072o23r35ege.apps.googleusercontent.com";
const BE_URL = import.meta.env.VITE_EASYFIND_BACKEND_URL || import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:3115";
const allowedEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];

const WrappedGoogleLoginButton = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const handleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) {
        throw new Error("Missing Google credential token");
      }

      const decoded = jwtDecode(idToken);
      const email = decoded?.email;

      console.log("✅ Google ID Token received for:", email);

      if (!email || !allowedEmails.map((e) => e.toLowerCase()).includes(email.toLowerCase())) {
        const msg = `❌ Access denied: ${email || "unknown"} is not an authorized admin email.`;
        console.warn(msg);
        setMessage(msg);
        return;
      }

      const res = await fetch(`${BE_URL}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Admin login failed:", data);
        throw new Error(data.error || "Login failed");
      }
      if (!data?.token) {
        console.error("Admin login response missing token:", data);
        throw new Error("Auth response missing token");
      }

      localStorage.setItem("adminAuthToken", data.token);
      navigate('/admin', { replace: true });
    } catch (error) {
      const msg = `❌ Login failed: ${error?.response?.data || error.message}`;
      console.error(msg);
      setMessage(msg);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        padding: 24
      }}>
        <div style={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
          padding: 32,
          textAlign: 'center'
        }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 700, color: '#111827' }}>
            Admin Dashboard
          </h1>
          <p style={{ margin: '0 0 24px 0', fontSize: 14, color: '#6b7280' }}>
            Sign in with your Google account
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setMessage("❌ Google Login Failed")}
            />
          </div>

          {message && (
            <div style={{
              marginTop: 16,
              padding: '12px 14px',
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 8,
              fontSize: 14,
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default WrappedGoogleLoginButton;