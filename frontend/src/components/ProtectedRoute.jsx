import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const hasToken = !!localStorage.getItem('token');

  if (!user && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
