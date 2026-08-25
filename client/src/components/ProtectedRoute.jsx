import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.hash = '#/login';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="app-container">
        <div className="glass-card">
          <div className="spinner"></div>
          <p className="subtitle">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}
