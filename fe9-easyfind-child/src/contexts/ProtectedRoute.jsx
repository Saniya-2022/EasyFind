import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
const API_URL = import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:3115";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, checkLoginStatus } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const runCheck = async () => {
      try {
        await checkLoginStatus();
      } finally {
        if (mounted) setChecking(false);
      }
    };

    runCheck();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || checking) return <div>Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;

