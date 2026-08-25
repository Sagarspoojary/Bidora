import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import auctionService from '../services/auctionService';

export function Auctions() {
  const [auctions, setAuctions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAuctions = async (query = '') => {
    try {
      setLoading(true);
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
      <div className="dash-error-view glass-card" style={{ maxWidth: '400px', margin: '40px auto', padding: '24px' }}>
        <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>
        <button onClick={() => { setError(''); loadAuctions(); }} className="btn-primary" style={{ marginTop: '16px' }}>Retry</button>
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
        <div className="dash-view-loading">
          <p>Loading auctions list...</p>
        </div>
      ) : auctions.length === 0 ? (
        <div className="empty-centerpiece-state glass-card" style={{ padding: '60px 40px' }}>
          <span className="empty-state-icon" style={{ fontSize: '3.5rem' }}>🔍</span>
          <p className="empty-state-headline">No Auctions Found</p>
          <p className="empty-state-sub">Try searching using different keywords or filters.</p>
          {search && (
            <button onClick={() => { setSearch(''); loadAuctions(); }} className="btn-primary" style={{ marginTop: '20px', maxWidth: '200px' }}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="auctions-grid">
          {auctions.map((item, idx) => (
            <motion.div 
              key={item.id} 
              className="auction-catalog-card glass-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, type: 'spring', stiffness: 100 }}
              whileHover={{ y: -4 }}
            >
              {/* Product Image */}
              <div className="catalog-image-wrap">
                <img src={item.image_url} alt={item.title} className="catalog-img" />
                <span className="catalog-status-badge">LIVE</span>
              </div>

              {/* Product Meta */}
              <div className="catalog-meta-area">
                <h4 className="catalog-title">{item.title}</h4>
                <p className="catalog-desc">{item.description}</p>
                
                <div className="catalog-price-row">
                  <div className="price-item">
                    <span className="price-label">STARTING BID</span>
                    <span className="price-val">${Number(item.starting_price).toLocaleString('en-US')}</span>
                  </div>
                  <div className="price-item">
                    <span className="price-label">CURRENT BID</span>
                    <span className="price-val-glow">${Number(item.current_price).toLocaleString('en-US')}</span>
                  </div>
                </div>

                <div className="catalog-divider"></div>

                <div className="catalog-footer">
                  <span className="time-remaining-label">Ends In: 24h</span>
                  <button type="button" className="btn-view-catalog-item" disabled>
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default Auctions;
