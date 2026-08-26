import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import auctionService from '../services/auctionService';

// Individual Auction Card with real ticking countdown timer logic
function AuctionCard({ item, idx }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [status, setStatus] = useState(item.status);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const start = new Date(item.start_time);
      const end = new Date(item.end_time);

      if (now < start) {
        setStatus('UPCOMING');
        const diff = start - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`Starts in: ${hours}h ${mins}m ${secs}s`);
      } else if (now >= end) {
        setStatus('ENDED');
        setTimeLeft('Ended');
      } else {
        setStatus('LIVE');
        const diff = end - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`Ends in: ${hours}h ${mins}m ${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [item]);

  const handleViewDetails = () => {
    window.location.hash = `#/auctions/${item.id}`;
  };

  return (
    <motion.div 
      className="auction-catalog-card glass-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -4 }}
    >
      {/* Product Image */}
      <div className="catalog-image-wrap">
        <img 
          src={item.image_url || '/images/luxury_watch.jpg'} 
          alt={item.title} 
          className="catalog-img" 
          onError={(e) => {
            e.target.src = '/images/luxury_watch.jpg'; // fallback image
          }}
        />
        <span className={`catalog-status-badge status-${status.toLowerCase()}`}>
          {status}
        </span>
      </div>

      {/* Product Meta */}
      <div className="catalog-meta-area">
        <h4 className="catalog-title">{item.title}</h4>
        <p className="catalog-desc">{item.description}</p>
        
        <div className="catalog-price-row">
          <div className="price-item">
            <span className="price-label">STARTING BID</span>
            <span className="price-val">${Number(item.starting_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="price-item">
            <span className="price-label">CURRENT BID</span>
            <span className="price-val-glow">${Number(item.current_price || item.starting_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="catalog-divider"></div>

        <div className="catalog-footer">
          <span className="time-remaining-label" style={{ color: status === 'ENDED' ? '#ef4444' : '#64748b' }}>
            {timeLeft}
          </span>
          <button 
            type="button" 
            className="btn-view-catalog-item-active" 
            onClick={handleViewDetails}
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton Card Loader
function SkeletonCard() {
  return (
    <div className="auction-catalog-card glass-card skeleton-card-glow" style={{ minHeight: '380px', opacity: 0.5 }}>
      <div style={{ height: '200px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px 16px 0 0' }}></div>
      <div style={{ padding: '20px' }}>
        <div style={{ height: '20px', width: '60%', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', marginBottom: '10px' }}></div>
        <div style={{ height: '14px', width: '90%', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', marginBottom: '20px' }}></div>
        <div style={{ height: '50px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '16px' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ height: '14px', width: '30%', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}></div>
          <div style={{ height: '32px', width: '40%', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}></div>
        </div>
      </div>
    </div>
  );
}

export function Auctions() {
  const [auctions, setAuctions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAuctions = async (query = '') => {
    try {
      setLoading(true);
      setError('');
      const list = await auctionService.getAll(query);
      setAuctions(list);
    } catch (err) {
      console.error('Failed to load auctions:', err);
      setError('Unable to load auctions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuctions();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAuctions(search);
  };

  if (error) {
    return (
      <div className="dash-error-view glass-card" style={{ maxWidth: '400px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>⚠️</span>
        <p style={{ color: '#ef4444', fontWeight: 650, marginBottom: '16px' }}>{error}</p>
        <button onClick={() => { setError(''); loadAuctions(); }} className="btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <motion.div 
      className="dashboard-view-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <header className="dash-welcome-header">
        <h2 className="welcome-title">Discover Auctions</h2>
        <p className="welcome-subtitle">Explore live items and place your bids.</p>
      </header>

      {/* Search & Filter Bar */}
      <div className="discovery-search-bar">
        <form onSubmit={handleSearchSubmit} className="search-form-wrap">
          <input 
            type="text" 
            className="search-input-field" 
            placeholder="Search items by name, model or designer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="search-submit-btn">Search</button>
        </form>
      </div>

      {/* Grid of Auctions */}
      {loading ? (
        <div className="auctions-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : auctions.length === 0 ? (
        <div className="empty-centerpiece-state glass-card" style={{ padding: '60px 40px' }}>
          <span className="empty-state-icon" style={{ fontSize: '3.5rem' }}>🔍</span>
          <p className="empty-state-headline">No Auctions Found</p>
          <p className="empty-state-sub">There are currently no auctions to explore.</p>
          {search && (
            <button onClick={() => { setSearch(''); loadAuctions(); }} className="btn-primary" style={{ marginTop: '20px', maxWidth: '200px' }}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="auctions-grid">
          {auctions.map((item, idx) => (
            <AuctionCard key={item.id} item={item} idx={idx} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default Auctions;
