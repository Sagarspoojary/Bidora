import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IntroLogo } from './components/IntroLogo';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Auth from './pages/Auth';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Auctions from './pages/Auctions';
import CreateAuction from './pages/CreateAuction';
import MyBids from './pages/MyBids';
import MyAuctions from './pages/MyAuctions';
import History from './pages/History';
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

  const navigateTo = (path) => {
    window.location.hash = path;
  };

  // Handle protected redirects and guards
  useEffect(() => {
    if (!loading) {
      const protectedPaths = [
        '#/dashboard',
        '#/auctions',
        '#/create-auction',
        '#/my-bids',
        '#/my-auctions',
        '#/history'
      ];

      const isPathProtected = protectedPaths.includes(currentPath);

      if (user) {
        // Authenticated user on entry/auth pages -> redirect to Dashboard
        if (currentPath === '#/login' || currentPath === '#/register' || currentPath === '#/') {
          navigateTo('#/dashboard');
        }
      } else {
        // Unauthenticated user trying to access any protected workspace path -> force login redirect
        if (isPathProtected || currentPath === '#/') {
          navigateTo('#/login');
        }
      }
    }
  }, [user, loading, currentPath]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    if (!loading) {
      if (user) {
        navigateTo('#/dashboard');
      } else {
        navigateTo('#/login');
      }
    }
  };

  // If intro is active on entry, render IntroLogo
  if (showIntro && currentPath === '#/') {
    return <IntroLogo onComplete={handleIntroComplete} />;
  }

  // Routing and Layout rendering
  const renderPage = () => {
    switch (currentPath) {
      case '#/dashboard':
        return <Dashboard />;
      case '#/auctions':
        return <Auctions />;
      case '#/create-auction':
        return <CreateAuction />;
      case '#/my-bids':
        return <MyBids />;
      case '#/my-auctions':
        return <MyAuctions />;
      case '#/history':
        return <History />;
      default:
        return <Dashboard />;
    }
  };

  const protectedPaths = [
    '#/dashboard',
    '#/auctions',
    '#/create-auction',
    '#/my-bids',
    '#/my-auctions',
    '#/history'
  ];

  if (user && protectedPaths.includes(currentPath)) {
    return (
      <DashboardLayout currentPath={currentPath} navigateTo={navigateTo}>
        {renderPage()}
      </DashboardLayout>
    );
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
