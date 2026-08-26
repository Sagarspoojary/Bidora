import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import bidService from '../services/bidService';

export function MyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBids = async () => {
      try {
        const data = await bidService.getMyBids();
        setBids(data);
      } catch (err) {
        console.error('Failed to load my bids:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBids();
  }, []);

  return (
    <motion.div 
      className="dashboard-view-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <header className="dash-welcome-header">
        <h2 className="welcome-title">My Bids</h2>
        <p className="welcome-subtitle">Track the status of your active and past bids in the arena.</p>
      </header>

      {loading ? (
        <div className="dash-view-loading">
          <p>Loading your bids history...</p>
        </div>
      ) : bids.length === 0 ? (
        <div className="empty-centerpiece-state glass-card">
          <span className="empty-state-icon">🏷️</span>
          <p className="empty-state-headline">No Bids Placed Yet</p>
          <p className="empty-state-sub">Start participating in active auctions to track your bidding outcomes here.</p>
        </div>
      ) : (
        <div className="workspace-list-grid">
          {bids.map((bid, idx) => {
            const isWinning = bid.status === 'Winning';
            const handleViewArena = () => {
              window.location.hash = `#/auctions/${bid.id}`;
            };

            return (
              <motion.div 
                key={bid.id} 
                className="workspace-item-card glass-card"
                style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, y: -6, boxShadow: '0 25px 50px rgba(0, 0, 0, 0.45)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 120 }}
              >
                {/* Catalog Image Banner */}
                <div className="catalog-image-wrap" style={{ height: '150px' }}>
                  <img src={bid.image_url || '/images/luxury_watch.jpg'} alt={bid.title} className="catalog-img" />
                  <span className={`catalog-status-badge ${isWinning ? 'status-live' : 'status-upcoming'}`}>LIVE</span>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div className="workspace-card-header" style={{ marginBottom: '12px' }}>
                    <h4 className="workspace-item-title">{bid.title}</h4>
                    <span className={`status-badge-indicator ${isWinning ? 'status-winning' : 'status-losing'}`}>
                      {bid.status}
                    </span>
                  </div>

                  {(() => {
                    const getCurrencySymbol = (code) => {
                      switch (code) {
                        case 'INR': return '₹';
                        case 'EUR': return '€';
                        case 'GBP': return '£';
                        default: return '$';
                      }
                    };
                    const symbol = getCurrencySymbol(bid.currency);
                    return (
                      <div className="workspace-bid-meta">
                        <div className="meta-price-box">
                          <span className="meta-price-label">YOUR HIGHEST BID</span>
                          <span className="meta-price-val">{symbol}{Number(bid.user_highest_bid).toLocaleString('en-US')}</span>
                        </div>

                        <div className="meta-price-box">
                          <span className="meta-price-label">CURRENT HIGHEST BID</span>
                          <span className={`meta-price-val ${isWinning ? 'price-glow-green' : 'price-glow-red'}`}>
                            {symbol}{Number(bid.current_highest_bid || bid.current_price).toLocaleString('en-US')}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="workspace-card-footer" style={{ marginTop: '16px' }}>
                    <span className="workspace-time-remaining">Remaining: 24h</span>
                    <button 
                      type="button" 
                      className="btn-workspace-action" 
                      onClick={handleViewArena}
                      style={{ cursor: 'pointer' }}
                    >
                      View Arena
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default MyBids;
