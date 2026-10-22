import React from 'react';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const ProtectedRoute = ({ children, role }) => {
  const { currentUser } = useLanguage();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (role && currentUser.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
