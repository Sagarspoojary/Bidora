import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IntroLogo } from './components/IntroLogo';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Auth from './pages/Auth';
import AuctionArena from './pages/AuctionArena';
import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1017326442654-placeholderid.apps.googleusercontent.com';

function MainAppContent() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle automatic route redirects based on authentication state
  useEffect(() => {
    if (!loading) {
      if (user) {
        // Authenticated users go straight to the Auction Arena dashboard
        if (currentPath === '#/login' || currentPath === '#/register' || currentPath === '#/') {
          window.location.hash = '#/arena';
        }
      } else {
        // Unauthenticated users are forced to log in
        if (currentPath === '#/arena') {
          window.location.hash = '#/login';
        }
      }
    }
  }, [user, loading, currentPath]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    if (!loading) {
      if (user) {
        window.location.hash = '#/arena';
      } else {
        window.location.hash = '#/login';
      }
    }
  };

  // If intro is running, render animated IntroLogo
  if (showIntro && currentPath === '#/') {
    return <IntroLogo onComplete={handleIntroComplete} />;
  }

  // Route mapping
  if (currentPath === '#/arena' && user) {
    return <AuctionArena />;
  }

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
