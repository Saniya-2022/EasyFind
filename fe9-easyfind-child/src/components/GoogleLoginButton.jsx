import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const { loginWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  const handleSuccess = async (credentialResponse) => {
    try {
      console.log("✅ ID Token:", credentialResponse.credential);
      const data = await loginWithGoogle(credentialResponse.credential);
      if (data?.logged_in) {
        navigate("/dashboard", { replace: true });
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      setError(error.message || "Login failed. Please try again.");
    }
  };

  return (
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
        padding: 24
      }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
            Sign in to EasyFind
          </h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              console.error('❌ Login Failed');
              setError('Google Sign-In failed. Please try again.');
            }}
          />
        </div>

        {error && (
          <div style={{
            marginTop: 8,
            padding: '10px 12px',
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 8,
            fontSize: 14,
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleLoginButton;

