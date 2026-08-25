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
            return (
              <motion.div 
                key={bid.id} 
                className="workspace-item-card glass-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, type: 'spring', stiffness: 100 }}
              >
                <div className="workspace-card-header">
                  <h4 className="workspace-item-title">{bid.title}</h4>
                  <span className={`status-badge-indicator ${isWinning ? 'status-winning' : 'status-losing'}`}>
                    {bid.status}
                  </span>
                </div>

                <div className="workspace-bid-meta">
                  <div className="meta-price-box">
                    <span className="meta-price-label">YOUR HIGHEST BID</span>
                    <span className="meta-price-val">${Number(bid.user_highest_bid).toLocaleString('en-US')}</span>
                  </div>

                  <div className="meta-price-box">
                    <span className="meta-price-label">CURRENT HIGHEST BID</span>
                    <span className={`meta-price-val ${isWinning ? 'price-glow-green' : 'price-glow-red'}`}>
                      ${Number(bid.current_highest_bid).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                <div className="workspace-card-footer">
                  <span className="workspace-time-remaining">Remaining: 24h</span>
                  <button type="button" className="btn-workspace-action" disabled>
                    View Arena
                  </button>
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
