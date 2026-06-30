import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";

import GoogleLoginButton from "../components/GoogleLoginButton";
import Layout from "../layouts/Layout";
import Dashboard from "../components/UserHome";
import UserProfile from "../components/UserProfile";
import ReportItem from "../components/ReportItem";
import SearchItem from "../components/SearchItem";
import NotifyLostItem from "../components/NotifyLostItem";
import MyQRPass from "../components/MyQRPass";
import MyClaims from "../components/MyClaims";
import MyMatches from "../components/MyMatches";

import ProtectedRoute from "../contexts/ProtectedRoute";

const App = () => {
  return (
    
      <Router>
        <AuthProvider>
        <NotificationProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<GoogleLoginButton />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="user-profile" element={<UserProfile />} />
            <Route path="report-item" element={<ReportItem />} />
            <Route path="search-item" element={<SearchItem />} />
            <Route path="lost-item" element={<NotifyLostItem />} />
            <Route path="my-matches" element={<MyMatches />} />
            <Route path="my-qr-pass" element={<MyQRPass />} />
            <Route path="my-claims" element={<MyClaims />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </NotificationProvider>
        </AuthProvider>
      </Router>
  );
};

export default App;
