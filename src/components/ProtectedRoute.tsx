import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean;
  fallbackView?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false, 
  requireStaff = false,
  fallbackView
}) => {
  const { user, loading, isAdmin, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    if (fallbackView) fallbackView();
    return null;
  }

  if (requireAdmin && !isAdmin) {
    if (fallbackView) fallbackView();
    return null;
  }

  if (requireStaff && !isStaff && !isAdmin) {
    if (fallbackView) fallbackView();
    return null;
  }

  return <>{children}</>;
};
