import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const BE_URL = import.meta.env.VITE_EASYFIND_BACKEND_URL || import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:3115";

const ProtectedRoute = ({ children }) => {
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("adminAuthToken");
        if (!token) {
          setIsValid(false);
          setLoading(false);
          return;
        }

        const res = await fetch(`${BE_URL}/auth/admin/check-auth`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await res.json();
        console.log("at the admin protected route res", res, data);
        setIsValid(res.ok && data.logged_in === true);

      } catch (error) {
        console.error("❌ Admin auth check failed:", error.message);
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Run only once on component mount

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return isValid ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;