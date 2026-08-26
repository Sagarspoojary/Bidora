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
import AuctionDetails from './pages/AuctionDetails';
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
    if (showIntro) return; // Do not redirect while intro logo is showing

    if (!loading) {
      const isDetailsPath = currentPath.startsWith('#/auctions/') && currentPath.split('/').length === 3;
      const protectedPaths = [
        '#/dashboard',
        '#/auctions',
        '#/create-auction',
        '#/my-bids',
        '#/my-auctions'
      ];

      const isPathProtected = protectedPaths.includes(currentPath) || isDetailsPath;

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
  }, [user, loading, currentPath, showIntro]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    if (!loading) {
      if (currentPath.startsWith('#/reset-password')) return;
      if (user) {
        if (currentPath === '#/login' || currentPath === '#/register' || currentPath === '#/') {
          navigateTo('#/dashboard');
        }
      } else {
        if (currentPath === '#/') {
          navigateTo('#/login');
        }
      }
    }
  };

  // If intro is active on entry, render IntroLogo
  if (showIntro) {
    return <IntroLogo onComplete={handleIntroComplete} />;
  }

  // Routing and Layout rendering
  const renderPage = () => {
    const isDetailsPath = currentPath.startsWith('#/auctions/') && currentPath.split('/').length === 3;
    if (isDetailsPath) {
      const auctionId = currentPath.split('/')[2];
      return <AuctionDetails auctionId={auctionId} />;
    }

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
      default:
        return <Dashboard />;
    }
  };

  const isDetailsPath = currentPath.startsWith('#/auctions/') && currentPath.split('/').length === 3;
  const protectedPaths = [
    '#/dashboard',
    '#/auctions',
    '#/create-auction',
    '#/my-bids',
    '#/my-auctions'
  ];

  if (user && (protectedPaths.includes(currentPath) || isDetailsPath)) {
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
