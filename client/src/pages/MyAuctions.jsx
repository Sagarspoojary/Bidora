import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import auctionService from '../services/auctionService';

export function MyAuctions() {
  const [myAuctions, setMyAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyAuctions = async () => {
      try {
        const data = await auctionService.getMyAuctions();
        setMyAuctions(data);
      } catch (err) {
        console.error('Failed to load my auctions:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMyAuctions();
  }, []);

  return (
    <motion.div 
      className="dashboard-view-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <header className="dash-welcome-header">
        <h2 className="welcome-title">My Registered Auctions</h2>
        <p className="welcome-subtitle">Manage items you have registered for live bidding.</p>
      </header>

      {loading ? (
        <div className="dash-view-loading">
          <p>Retrieving your registration list...</p>
        </div>
      ) : myAuctions.length === 0 ? (
        <div className="empty-centerpiece-state glass-card">
          <span className="empty-state-icon">💎</span>
          <p className="empty-state-headline">No Auctions Registered</p>
          <p className="empty-state-sub">You have not registered any auction items yet. Go to "Create Auction" to register your first item!</p>
        </div>
      ) : (
        <div className="workspace-list-grid">
          {myAuctions.map((item, idx) => (
            <motion.div 
              key={item.id} 
              className="workspace-item-card glass-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, type: 'spring', stiffness: 100 }}
            >
              <div className="workspace-card-header">
                <h4 className="workspace-item-title">{item.title}</h4>
                <span className="status-badge-indicator status-live">
                  {item.status}
                </span>
              </div>

              <div className="workspace-bid-meta">
                <div className="meta-price-box">
                  <span className="meta-price-label">STARTING PRICE</span>
                  <span className="meta-price-val">${Number(item.starting_price).toLocaleString('en-US')}</span>
                </div>

                <div className="meta-price-box">
                  <span className="meta-price-label">CURRENT HIGHEST BID</span>
                  <span className="meta-price-val price-glow-gold">
                    ${Number(item.current_price).toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              <div className="workspace-card-footer">
                <span className="workspace-time-remaining">Bids Placed: {item.bids_count}</span>
                <button type="button" className="btn-workspace-action" disabled>
                  Manage Item
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default MyAuctions;
