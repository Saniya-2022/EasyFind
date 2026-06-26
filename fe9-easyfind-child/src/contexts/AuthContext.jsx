import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
// ✅ Dynamic backend URL (from Vite env)
const AUTH_API_URL = import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:3115";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken") || null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // ✅ Check if user is logged in
  const checkLoginStatus = async () => {
    try {
      const authToken = localStorage.getItem("authToken") || token;
      const headers = {};
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch(`${AUTH_API_URL}/auth/user/check-auth`, {
        method: "GET",
        headers,
      });
      const data = await res.json();
  console.log("at the check login status res:",data)
      if (data.logged_in) {

       
       console.log("logged in");

        setUser(data.user);
        setIsAuthenticated(true);
        // setToken(data.token)
      } else {
        console.log("not logged in")
        setUser(null);
        setToken(null)
        setIsAuthenticated(false);
      }
      return data;
    } catch (err) {
      console.error("check-auth failed (likely no cookie yet):", err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Run an initial auth check on app mount so user details are available after refresh
  useEffect(() => {
    checkLoginStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Called when user logs in with Google
  const loginWithGoogle = async (idToken) => {
    try {
      console.log("reached login with google", idToken);
      const res = await fetch(`${AUTH_API_URL}/auth/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Login response error:", data);
        throw new Error(data.error || "Login failed");
      }
      if (!data.token) {
        console.error("Login response missing token:", data);
        throw new Error("Auth token missing from response");
      }

      console.log("Login successful:", data);
      setUser(data.user);
      setIsAuthenticated(true);
      setToken(data.token);
      localStorage.setItem("authToken", data.token);
      return data;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      console.log("at the logout")
      await fetch(`${AUTH_API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
  setUser(null);
  setToken(null);
  setIsAuthenticated(false);
      console.log("calling /login")
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loginWithGoogle, logout, loading, checkLoginStatus, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
