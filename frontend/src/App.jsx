import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';

const App = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="center-loader-screen">
        <div className="spinner"></div>
        <p>Initializing Student ERP application...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Route / Index Redirect */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin' : '/student'} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin' : '/student'} replace />
              ) : (
                <Login />
              )
            }
          />

          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin' : '/student'} replace />
              ) : (
                <Register />
              )
            }
          />

          {/* Protected Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Student Portal */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
