import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="center-loader-screen">
        <div className="spinner"></div>
        <p>Verifying secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If authenticated user attempts to access forbidden role page, redirect to their home portal
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/student'} replace />;
  }

  return children;
};

export default ProtectedRoute;
