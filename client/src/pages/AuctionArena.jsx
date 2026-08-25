import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export function AuctionArena() {
  const { logout, user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  // Fetch active centerpiece auction
  useEffect(() => {
    const fetchActiveAuction = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/auctions/active', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (response.ok) {
          setAuction(result.data);
        } else {
          setError(result.message || 'Failed to load centerpiece auction');
        }
      } catch (err) {
        console.error('Fetch active auction error:', err);
        setError('Network error: Could not reach the server');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveAuction();
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (!auction || !auction.end_time) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(auction.end_time) - +new Date();
      let timeLeftData = { hours: 0, minutes: 0, seconds: 0, expired: true };

      if (difference > 0) {
        timeLeftData = {
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          expired: false,
        };
      }

      setTimeLeft(timeLeftData);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  const formatNumber = (num) => String(num).padStart(2, '0');

  if (loading) {
    return (
      <div className="auth-card-container">
        <div className="stars"></div>
        <div className="glowing-orb orb-1"></div>
        <div className="glowing-orb orb-2"></div>
        <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 500, letterSpacing: '0.1em' }}>
          LOADING ARENA...
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="auth-card-container">
        <div className="stars"></div>
        <div className="glowing-orb orb-1"></div>
        <div className="glowing-orb orb-2"></div>
        <motion.div 
          className="glass-card" 
          style={{ padding: '32px', textAlign: 'center', maxWidth: '400px' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>⚠️</span>
          <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>Connection Error</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
            {error || 'No active auctions found at the moment. Please check back later.'}
          </p>
          <button onClick={logout} className="btn-primary">Return to Entry</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="arena-container">
      <div className="stars"></div>
      <div className="glowing-orb orb-1" style={{ top: '10%', left: '15%' }}></div>
      <div className="glowing-orb orb-2" style={{ bottom: '15%', right: '10%' }}></div>

      {/* Floating Arena Header */}
      <nav className="arena-navbar">
        <div className="arena-logo">
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" className="logo-svg-glow">
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
          <span className="arena-title">BIDORA ARENA</span>
        </div>
        
        <div className="user-profile-widget">
          <span className="user-display-name">👤 {user?.name || 'Bidder'}</span>
          <button onClick={logout} className="btn-signout-mini">Sign Out</button>
        </div>
      </nav>

      {/* Main Glass Grid */}
      <motion.main 
        className="arena-grid"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 100, delay: 0.15 }}
      >
        {/* Left Side: Centerpiece Image Showcase */}
        <section className="arena-showcase-panel">
          <div className="glass-showcase-card">
            <div className="arena-badge">ACTIVE AUCTION</div>
            <motion.div 
              className="image-wrapper"
              whileHover={{ scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <img src={auction.image_url} alt={auction.title} className="showcase-img" />
              <div className="showcase-glow-border"></div>
            </motion.div>
          </div>
        </section>

        {/* Right Side: Info, Timer, and Bidding Module */}
        <section className="arena-control-panel">
          <div className="glass-control-card">
            <div className="item-meta">
              <h1 className="item-title">{auction.title}</h1>
              <p className="item-description">{auction.description}</p>
            </div>

            {/* Countdown Timer Block */}
            <div className="timer-section">
              <h3 className="section-label">TIME REMAINING</h3>
              <div className="timer-blocks">
                <div className="timer-block">
                  <span className="time-num">{formatNumber(timeLeft.hours)}</span>
                  <span className="time-label">HOURS</span>
                </div>
                <span className="timer-colon">:</span>
                <div className="timer-block">
                  <span className="time-num">{formatNumber(timeLeft.minutes)}</span>
                  <span className="time-label">MINUTES</span>
                </div>
                <span className="timer-colon">:</span>
                <div className="timer-block">
                  <span className="time-num">{formatNumber(timeLeft.seconds)}</span>
                  <span className="time-label">SECONDS</span>
                </div>
              </div>
            </div>

            {/* Bidding Stats */}
            <div className="bid-stats-section">
              <div className="stat-card starting-price">
                <span className="stat-label">STARTING BID</span>
                <span className="stat-value">${Number(auction.starting_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="stat-card current-bid">
                <span className="stat-label">CURRENT HIGHEST BID</span>
                <span className="stat-value-glow">${Number(auction.current_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Placing Bid Interactive Panel (Ready for Phase 4) */}
            <div className="interactive-bid-panel">
              <h3 className="section-label">PLACE YOUR BID</h3>
              <div className="bid-form-group">
                <span className="currency-prefix">$</span>
                <input 
                  type="number" 
                  className="bid-input" 
                  placeholder={`Min bid: $${(Number(auction.current_price) + 100).toLocaleString('en-US')}`}
                  disabled 
                />
                <button type="button" className="btn-bid-submit" disabled>
                  Bidding Locked
                </button>
              </div>
              <p className="bid-hint">Place bids will be unlocked in the next development phase (Phase 4).</p>
            </div>
          </div>
        </section>
      </motion.main>
    </div>
  );
}

export default AuctionArena;
