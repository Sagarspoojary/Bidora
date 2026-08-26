import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import auctionService from '../services/auctionService';
import bidService from '../services/bidService';

export function Dashboard() {
  const { user } = useAuth();
  
  // States
  const [stats, setStats] = useState({ myBids: 0, myAuctions: 0, activeParticipation: 0, auctionsWon: 0 });
  const [activeAuction, setActiveAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  // Bid placement state
  const [bidAmount, setBidAmount] = useState('');
  const [bidStatus, setBidStatus] = useState({ success: '', error: '' });
  const [submittingBid, setSubmittingBid] = useState(false);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = Number(bidAmount);
    if (!bidAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setBidStatus({ success: '', error: 'Please enter a valid positive bid amount.' });
      return;
    }

    const currentPrice = Number(activeAuction.current_price || activeAuction.starting_price);
    if (parsedAmount <= currentPrice) {
      setBidStatus({ success: '', error: `Bid must be strictly higher than current price of $${currentPrice.toLocaleString('en-US')}` });
      return;
    }

    try {
      setSubmittingBid(true);
      setBidStatus({ success: '', error: '' });
      await bidService.placeBid(activeAuction.id, parsedAmount);
      
      setBidStatus({ success: 'Bid placed successfully!', error: '' });
      setBidAmount('');

      // Reload dashboard data to reflect the updated price
      const [statsData, auctionData] = await Promise.all([
        bidService.getStats(),
        auctionService.getActive(),
      ]);
      setStats(statsData);
      setActiveAuction(auctionData);

      // Auto dismiss success alert
      setTimeout(() => {
        setBidStatus(prev => ({ ...prev, success: '' }));
      }, 4000);
    } catch (err) {
      console.error(err);
      setBidStatus({ success: '', error: err.message || 'Failed to place bid. Please try again.' });
    } finally {
      setSubmittingBid(false);
    }
  };

  // Load dashboard statistics and active centerpiece
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, auctionData] = await Promise.all([
          bidService.getStats(),
          auctionService.getActive(),
        ]);
        setStats(statsData);
        setActiveAuction(auctionData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (!activeAuction || !activeAuction.end_time) return;

    const calculateTime = () => {
      const difference = +new Date(activeAuction.end_time) - +new Date();
      let timeData = { hours: 0, minutes: 0, seconds: 0, expired: true };

      if (difference > 0) {
        timeData = {
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          expired: false,
        };
      }
      setTimeLeft(timeData);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [activeAuction]);

  const formatNumber = (num) => String(num).padStart(2, '0');

  // Stats Card data config
  const statCardsData = [
    { title: 'My Bids', value: stats.myBids, icon: '🏷️', color: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' },
    { title: 'My Auctions', value: stats.myAuctions, icon: '💎', color: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)' },
    { title: 'Active Bids', value: stats.activeParticipation, icon: '⚡', color: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.3)' },
    { title: 'Auctions Won', value: stats.auctionsWon, icon: '🏆', color: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
  ];

  if (loading) {
    return (
      <div className="dash-view-loading">
        <p>Initializing Dashboard Workspace...</p>
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
      {/* Welcome Banner */}
      <header className="dash-welcome-header">
        <h2 className="welcome-title">Welcome back, {user?.name || 'Bidder'} 👋</h2>
        <p className="welcome-subtitle">Discover. Participate. Win.</p>
      </header>

      {/* Grid of 4 compact statistic cards */}
      <section className="dash-stats-grid">
        {statCardsData.map((card, idx) => (
          <motion.div 
            key={card.title} 
            className="stat-metric-card glass-card"
            style={{ backgroundColor: card.color, borderColor: card.border }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, type: 'spring', stiffness: 100 }}
          >
            <div className="stat-card-row">
              <span className="stat-card-icon">{card.icon}</span>
              <div className="stat-card-meta">
                <span className="stat-card-label">{card.title}</span>
                <span className="stat-card-value">{card.value}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Main live centerpiece auction area */}
      <h3 className="section-headline">Featured Centerpiece</h3>
      
      {activeAuction ? (
        <motion.div 
          className="live-centerpiece-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 80 }}
        >
          {/* Status Badge */}
          <div className="centerpiece-status-badge">🔴 LIVE AUCTION</div>

          {/* 2-Column inner card layout */}
          <div className="centerpiece-inner-layout">
            {/* Left: Product Image */}
            <div className="centerpiece-image-area">
              <div className="centerpiece-image-wrap">
                <img src={activeAuction.image_url} alt={activeAuction.title} className="centerpiece-img" />
                <div className="centerpiece-img-glow"></div>
              </div>
            </div>

            {/* Right: Info and controls */}
            <div className="centerpiece-info-area">
              <h4 className="centerpiece-title">{activeAuction.title}</h4>
              <p className="centerpiece-desc">{activeAuction.description}</p>

              {/* Grid of countdown and pricing */}
              <div className="centerpiece-bid-meta">
                {/* Countdown */}
                <div className="meta-box timer-box">
                  <span className="meta-label">AUCTION ENDS IN</span>
                  <span className="meta-value timer-digits">
                    {formatNumber(timeLeft.hours)} : {formatNumber(timeLeft.minutes)} : {formatNumber(timeLeft.seconds)}
                  </span>
                </div>

                {/* Price */}
                {(() => {
                  const getCurrencySymbol = (code) => {
                    switch (code) {
                      case 'INR': return '₹';
                      case 'EUR': return '€';
                      case 'GBP': return '£';
                      default: return '$';
                    }
                  };
                  const symbol = getCurrencySymbol(activeAuction.currency);
                  return (
                    <>
                      <div className="meta-box price-box">
                        <span className="meta-label">CURRENT HIGHEST BID</span>
                        <span className="meta-value price-glow">
                          {symbol}{Number(activeAuction.current_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Bidding control interface */}
              {(() => {
                const getCurrencySymbol = (code) => {
                  switch (code) {
                    case 'INR': return '₹';
                    case 'EUR': return '€';
                    case 'GBP': return '£';
                    default: return '$';
                  }
                };
                const symbol = getCurrencySymbol(activeAuction.currency);
                return (
                  <div className="centerpiece-form-area">
                    {bidStatus.success && (
                      <div style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: '600', marginBottom: '12px', background: 'rgba(74, 222, 128, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.15)' }}>
                        {bidStatus.success}
                      </div>
                    )}
                    {bidStatus.error && (
                      <div style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: '600', marginBottom: '12px', background: 'rgba(248, 113, 113, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.15)' }}>
                        {bidStatus.error}
                      </div>
                    )}

                    <form onSubmit={handleBidSubmit} className="input-group-bid">
                      <span className="currency-prefix">{symbol}</span>
                      <input 
                        type="number" 
                        className="form-input-bid" 
                        placeholder={`Min Bid: ${symbol}${(Number(activeAuction.current_price) + 1).toLocaleString('en-US')}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        disabled={timeLeft.expired || submittingBid}
                      />
                      <button 
                        type="submit" 
                        className="btn-submit-bid" 
                    disabled={timeLeft.expired || submittingBid}
                    style={{
                      cursor: !timeLeft.expired ? 'pointer' : 'not-allowed',
                      opacity: !timeLeft.expired ? 1 : 0.6
                    }}
                  >
                    {submittingBid ? 'Placing...' : !timeLeft.expired ? 'Place Bid' : 'Closed'}
                  </button>
                </form>
                <p className="bid-hint-text">
                  {!timeLeft.expired 
                    ? 'Enter an amount higher than the current price to place your bid.' 
                    : 'This featured centerpiece auction has ended.'
                  }
                </p>
              </div>
            );
          })()}
        </div>
      </div>
        </motion.div>
      ) : (
        <div className="empty-centerpiece-state glass-card">
          <span className="empty-state-icon">🔔</span>
          <p className="empty-state-headline">No Active Centerpiece Auction</p>
          <p className="empty-state-sub">Check back later for active live events.</p>
        </div>
      )}
    </motion.div>
  );
}

export default Dashboard;
