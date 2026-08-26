import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

export function DashboardLayout({ children, currentPath, navigateTo }) {
  const { user, logout, updateProfile } = useAuth();
  
  // States for Sidebar and Dropdowns
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Profile Modal states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    try {
      setUpdatingProfile(true);
      await updateProfile(profileName);
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to save profile changes.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Refs for outside-click detectors
  const profileRef = useRef(null);
  const notifyRef = useRef(null);

  // Load notifications and poll every 10 seconds
  useEffect(() => {
    const loadNotify = async () => {
      try {
        const list = await notificationService.getNotifications();
        setNotifications(list);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    loadNotify();
    const interval = setInterval(loadNotify, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleNotifications = async () => {
    const nextOpenState = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpenState);
    if (nextOpenState) {
      try {
        await notificationService.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch (err) {
        console.error('Failed to mark notifications as read:', err);
      }
    }
  };

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
        setIsMobileDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '#/dashboard', icon: '📊' },
    { name: 'Auctions', path: '#/auctions', icon: '⚖️' },
    { name: 'Create Auction', path: '#/create-auction', icon: '➕' },
    { name: 'My Bids', path: '#/my-bids', icon: '🏷️' },
    { name: 'My Auctions', path: '#/my-auctions', icon: '💎' },
  ];

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <header className="dash-navbar">
        {/* Left: Brand Logo & Mobile Toggle */}
        <div className="navbar-left">
          <button 
            type="button"
            className="mobile-toggle-btn"
            onClick={() => setIsMobileDrawerOpen(true)}
          >
            🍔
          </button>
          
          <div className="navbar-logo" onClick={() => navigateTo('#/dashboard')} style={{ cursor: 'pointer' }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" className="logo-svg-glow">
              <path d="M 43,22 C 32,22 24,28 24,37 C 24,46 32,50 43,50 C 35,48 29,44 29,37 C 29,30 35,24 43,22 Z" fill="url(#nav-gold)" />
              <path d="M 43,50 C 32,50 24,54 24,63 C 24,72 32,78 43,78 C 35,76 29,72 29,63 C 29,54 35,52 43,50 Z" fill="url(#nav-gold)" />
              <path d="M 47,22 H 53 V 78 H 47 Z" fill="url(#nav-gold)" />
              <path d="M 42,22 H 58 V 25 H 42 Z" fill="url(#nav-gold)" />
              <path d="M 42,75 H 58 V 78 H 42 Z" fill="url(#nav-gold)" />
              <path d="M 57,22 C 72,22 81,33 81,50 C 81,67 72,78 57,78 C 66,74 74,63 74,50 C 74,37 66,26 57,22 Z" fill="url(#nav-gold)" />
              <defs>
                <linearGradient id="nav-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </linearGradient>
              </defs>
            </svg>
            <span className="brand-name">BIDORA</span>
          </div>
        </div>

        {/* Right: Notifications & Profile Dropdown */}
        <div className="navbar-right">
          {/* Notifications Trigger */}
          <div className="dropdown-wrapper" ref={notifyRef}>
            <button 
              type="button" 
              className={`nav-action-btn ${isNotificationsOpen ? 'active' : ''}`}
              onClick={handleToggleNotifications}
            >
              🔔
              {(() => {
                const unreadCount = notifications.filter(n => !n.is_read).length;
                return unreadCount > 0 ? <span className="notification-badge">{unreadCount}</span> : null;
              })()}
            </button>
            
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div 
                  className="dropdown-menu notifications-dropdown glass-card"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  <h4 className="dropdown-header-label">Notifications</h4>
                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div className="empty-state-text">No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="notification-item" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <p className="notify-title" style={{ fontWeight: '700', fontSize: '0.85rem', color: n.is_read ? '#cbd5e1' : '#fbbf24', margin: 0 }}>
                            {n.title}
                          </p>
                          <p className="notify-text" style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                            {n.message}
                          </p>
                          <span className="notify-time" style={{ fontSize: '0.65rem', color: '#64748b', alignSelf: 'flex-end', marginTop: '4px' }}>
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Widget & Dropdown */}
          <div className="dropdown-wrapper" ref={profileRef}>
            <button 
              type="button" 
              className="navbar-profile-trigger"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <span className="profile-avatar-char">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
              </span>
              <span className="profile-display-name">{user?.name || 'Bidder'}</span>
              <span className="dropdown-chevron">▼</span>
            </button>
            
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div 
                  className="dropdown-menu profile-dropdown glass-card"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Dropdown User Info Header */}
                  <div className="dropdown-profile-header">
                    <span className="dropdown-profile-avatar">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
                    </span>
                    <div className="profile-header-meta">
                      <p className="profile-meta-name">{user?.name}</p>
                      <p className="profile-meta-email">{user?.email}</p>
                    </div>
                  </div>
                  
                  {/* Dropdown links */}
                  <div className="dropdown-divider-line"></div>
                  
                  <button 
                    type="button" 
                    className="dropdown-item-btn"
                    onClick={() => { setIsProfileModalOpen(true); setIsProfileOpen(false); }}
                  >
                    👤 Profile
                  </button>
                  
                  <div className="dropdown-divider-line"></div>
                  
                  <button 
                    type="button" 
                    className="dropdown-item-btn logout-item-btn"
                    onClick={() => { setIsProfileOpen(false); logout(); }}
                  >
                    🚪 Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="dashboard-content-wrapper">
        {/* Sidebar (Desktop) */}
        <aside className={`dash-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header-action">
            <button 
              type="button" 
              className="btn-collapse-sidebar"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? '➡️' : '⬅️'}
            </button>
          </div>
          
          <nav className="sidebar-nav">
            {navItems.map(item => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => navigateTo(item.path)}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {!isSidebarCollapsed && <span className="nav-item-name">{item.name}</span>}
                  {isActive && !isSidebarCollapsed && (
                    <motion.div className="active-nav-indicator-sidebar" layoutId="sidebarActive" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Drawer (Overlay) */}
        <AnimatePresence>
          {isMobileDrawerOpen && (
            <>
              <motion.div 
                className="mobile-drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileDrawerOpen(false)}
              />
              <motion.aside 
                className="mobile-drawer-sidebar"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <div className="drawer-header">
                  <span className="drawer-title">BIDORA NAV</span>
                  <button 
                    type="button" 
                    className="btn-close-drawer"
                    onClick={() => setIsMobileDrawerOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                
                <nav className="sidebar-nav">
                  {navItems.map(item => {
                    const isActive = currentPath === item.path;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          navigateTo(item.path);
                          setIsMobileDrawerOpen(false);
                        }}
                      >
                        <span className="nav-item-icon">{item.icon}</span>
                        <span className="nav-item-name">{item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Dynamic Inner Page Renderer */}
        <main className="dashboard-main-content">
          {children}
        </main>
      </div>
      {isProfileModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001, padding: '16px' }}>
          <motion.div 
            className="glass-card" 
            style={{ width: '90%', maxWidth: '400px', padding: '32px', textAlign: 'left', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="welcome-title" style={{ fontSize: '1.4rem', marginBottom: '20px', color: '#fff' }}>User Profile Details</h3>
            <form onSubmit={handleProfileSubmit}>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)} 
                  required 
                />
              </div>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={user?.email || ''} 
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Account Role</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={user?.role === 'ADMIN' ? 'Administrator' : 'Registered Bidder'} 
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed', textTransform: 'capitalize' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn-workspace-action" 
                  onClick={() => setIsProfileModalOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: '10px 18px', borderRadius: '8px' }}
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ maxWidth: '140px', padding: '10px 20px', fontSize: '0.85rem' }}
                  disabled={updatingProfile}
                >
                  {updatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
