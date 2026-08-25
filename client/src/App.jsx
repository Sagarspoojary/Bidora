import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IntroLogo } from './components/IntroLogo';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Auth from './pages/Auth';
import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1017326442654-placeholderid.apps.googleusercontent.com';

function MainAppContent() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');
  const { loading } = useAuth();

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    if (!loading) {
      window.location.hash = '#/login';
    }
  };

  // If intro is running, render animated IntroLogo
  if (showIntro && currentPath === '#/') {
    return <IntroLogo onComplete={handleIntroComplete} />;
  }

  // Simple state-based routing
  if (currentPath === '#/login' || currentPath === '#/register' || currentPath.startsWith('#/reset-password')) {
    return <Auth />;
  }

  // Default fallback
  return <Auth />;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
