import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import auctionService from '../services/auctionService';
import bidService from '../services/bidService';

export function AuctionDetails({ auctionId }) {
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false, label: '' });

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

    const currentPrice = Number(auction.current_price || auction.starting_price);
    if (parsedAmount <= currentPrice) {
      setBidStatus({ success: '', error: `Bid must be strictly higher than current price of $${currentPrice.toLocaleString('en-US')}` });
      return;
    }

    try {
      setSubmittingBid(true);
      setBidStatus({ success: '', error: '' });
      await bidService.placeBid(auctionId, parsedAmount);
      
      setBidStatus({ success: 'Bid placed successfully!', error: '' });
      setBidAmount('');

      // Reload auction details to reflect the updated price
      const updated = await auctionService.getById(auctionId);
      setAuction(updated);

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

  // Fetch auction details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await auctionService.getById(auctionId);
        setAuction(data);
      } catch (err) {
        console.error('Fetch auction details error:', err);
        setError(err.message || 'Unable to retrieve auction details.');
      } finally {
        setLoading(false);
      }
    };
    if (auctionId) {
      fetchDetails();
    }
  }, [auctionId]);

  // Countdown clock ticking logic
  useEffect(() => {
    if (!auction || !auction.end_time) return;

    const calculateTime = () => {
      const now = new Date();
      const start = new Date(auction.start_time);
      const end = new Date(auction.end_time);
      
      let difference = 0;
      let label = 'Ends In';
      let expired = false;

      if (now < start) {
        difference = +start - +now;
        label = 'Starts In';
      } else if (now >= end) {
        expired = true;
        label = 'Ended';
      } else {
        difference = +end - +now;
        label = 'Ends In';
      }

      let timeData = { hours: 0, minutes: 0, seconds: 0, expired, label };

      if (difference > 0 && !expired) {
        timeData = {
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          expired,
          label,
        };
      }

      setTimeLeft(timeData);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  const formatNumber = (num) => String(num).padStart(2, '0');

  const handleBackToAuctions = () => {
    window.location.hash = '#/auctions';
  };

  if (loading) {
    return (
      <div className="dash-view-loading">
        <p>Loading auction specifications...</p>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="dash-error-view glass-card" style={{ maxWidth: '400px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>⚠️</span>
        <p style={{ color: '#ef4444', fontWeight: 650, marginBottom: '16px' }}>{error || 'Auction not found.'}</p>
        <button onClick={handleBackToAuctions} className="btn-primary">Return to Catalog</button>
      </div>
    );
  }

  const isBiddingActive = !timeLeft.expired && timeLeft.label === 'Ends In';

  return (
    <motion.div 
      className="dashboard-view-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <header className="dash-welcome-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="welcome-title">Auction Arena Detail</h2>
          <p className="welcome-subtitle">Specifications and live parameters for this registered item.</p>
        </div>
        <button 
          onClick={handleBackToAuctions} 
          className="btn-primary"
          style={{ maxWidth: '160px', padding: '10px 18px', fontSize: '0.85rem' }}
        >
          ← Back to Catalog
        </button>
      </header>

      {/* Main layout */}
      <div className="arena-grid" style={{ padding: '0', marginTop: '16px' }}>
        {/* Left: Image Card */}
        <section className="arena-showcase-panel">
          <div className="glass-showcase-card">
            <span className={`arena-badge status-${timeLeft.label === 'Ended' ? 'ended' : timeLeft.label === 'Starts In' ? 'upcoming' : 'live'}`}>
              {timeLeft.label === 'Ended' ? 'ENDED' : timeLeft.label === 'Starts In' ? 'UPCOMING' : 'LIVE'}
            </span>
            <div className="image-wrapper">
              <img src={auction.image_url || '/images/luxury_watch.jpg'} alt={auction.title} className="showcase-img" />
              <div className="showcase-glow-border"></div>
            </div>
          </div>
        </section>

        {/* Right: Pricing, Timers and Forms */}
        <section className="arena-control-panel">
          <div className="glass-control-card">
            <div className="item-meta">
              <h1 className="item-title">{auction.title}</h1>
              <p className="item-description">{auction.description}</p>
            </div>

            {/* Countdown timer */}
            <div className="timer-section">
              <h3 className="section-label">{timeLeft.label}</h3>
              {timeLeft.expired ? (
                <span className="time-num" style={{ color: '#ef4444', fontFamily: 'monospace' }}>AUCTION HAS ENDED</span>
              ) : (
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
              )}
            </div>

            {/* Pricing details */}
            <div className="bid-stats-section">
              <div className="stat-card starting-price">
                <span className="stat-label">STARTING BID</span>
                <span className="stat-value">${Number(auction.starting_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="stat-card current-bid">
                <span className="stat-label">CURRENT HIGHEST BID</span>
                <span className="stat-value-glow">${Number(auction.current_price || auction.starting_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Bidding inputs */}
            <div className="interactive-bid-panel">
              <h3 className="section-label">PLACE YOUR BID</h3>
              
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

              <form onSubmit={handleBidSubmit} className="bid-form-group">
                <span className="currency-prefix">$</span>
                <input 
                  type="number" 
                  className="bid-input" 
                  placeholder={`Min bid: $${(Number(auction.current_price || auction.starting_price) + 1).toLocaleString('en-US')}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  disabled={!isBiddingActive || submittingBid} 
                />
                <button 
                  type="submit" 
                  className="btn-bid-submit" 
                  disabled={!isBiddingActive || submittingBid}
                  style={{
                    cursor: isBiddingActive ? 'pointer' : 'not-allowed',
                    opacity: isBiddingActive ? 1 : 0.6
                  }}
                >
                  {submittingBid ? 'Placing...' : isBiddingActive ? 'Place Bid' : 'Auction Closed'}
                </button>
              </form>
              <p className="bid-hint">
                {isBiddingActive 
                  ? 'Enter a value higher than the current highest bid to place your offer.'
                  : 'This auction has ended. No further bids can be accepted.'
                }
              </p>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

export default AuctionDetails;
