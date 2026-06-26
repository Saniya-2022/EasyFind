import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from "./components/Dashboard";
import ApproveItems from "./components/ManageItems";
import GiveToStudent from "./components/GiveToStudent";
import UploadItem from "./components/UploadItem";
import EditItem from "./components/EditItem";

const BE_URL = import.meta.env.VITE_EASYFIND_BACKEND_URL || "http://localhost:3115";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("adminAuthToken");
        if (!token) {
          setIsAuthenticated(false);
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
        setIsAuthenticated(res.ok && data.logged_in === true);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', paddingTop: '50vh' }}>Loading...</div>;
  }

  return (
    <Router>
      <ThemeProvider theme={createTheme()}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={isAuthenticated ? <AdminLayout><AdminDashboard /></AdminLayout> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={isAuthenticated ? <AdminLayout><AdminDashboard /></AdminLayout> : <Navigate to="/login" replace />} />
          <Route path="/admin/approve" element={isAuthenticated ? <AdminLayout><ApproveItems /></AdminLayout> : <Navigate to="/login" replace />} />
          <Route path="/admin/give" element={isAuthenticated ? <AdminLayout><GiveToStudent /></AdminLayout> : <Navigate to="/login" replace />} />
          <Route path="/admin/upload" element={isAuthenticated ? <AdminLayout><UploadItem /></AdminLayout> : <Navigate to="/login" replace />} />
          <Route path="/admin/edit" element={isAuthenticated ? <AdminLayout><EditItem /></AdminLayout> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;

