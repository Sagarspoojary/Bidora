import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import auctionService from '../services/auctionService';
import bidService from '../services/bidService';

export function AuctionDetails({ auctionId }) {
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false, label: '' });

  // Bid placement state
  const [bidAmount, setBidAmount] = useState('');
  const [bidStatus, setBidStatus] = useState({ success: '', error: '' });
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidsList, setBidsList] = useState([]);

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

      // Reload auction details to reflect the updated price and bids history
      const [updated, updatedBids] = await Promise.all([
        auctionService.getById(auctionId),
        bidService.getBidsByAuction(auctionId)
      ]);
      setAuction(updated);
      setBidsList(updatedBids);

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
        const [data, bids] = await Promise.all([
          auctionService.getById(auctionId),
          bidService.getBidsByAuction(auctionId)
        ]);
        setAuction(data);
        setBidsList(bids);
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
            {(() => {
              const getCurrencySymbol = (code) => {
                switch (code) {
                  case 'INR': return '₹';
                  case 'EUR': return '€';
                  case 'GBP': return '£';
                  default: return '$';
                }
              };
              const symbol = getCurrencySymbol(auction.currency);
              const currentPriceVal = Number(auction.current_price || auction.starting_price);

              return (
                <>
                  <div className="bid-stats-section">
                    <div className="stat-card starting-price">
                      <span className="stat-label">STARTING BID</span>
                      <span className="stat-value">{symbol}{Number(auction.starting_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    
                    <div className="stat-card current-bid">
                      <span className="stat-label">CURRENT HIGHEST BID</span>
                      <span className="stat-value-glow">{symbol}{currentPriceVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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
                      <span className="currency-prefix">{symbol}</span>
                      <input 
                        type="number" 
                        className="bid-input" 
                        placeholder={`Min bid: ${symbol}${(currentPriceVal + 1).toLocaleString('en-US')}`}
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

                  {/* Personalized User Bidding Summary Box */}
                  <div className="bid-history-section" style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                    <h3 className="section-label" style={{ marginBottom: '12px', fontSize: '0.85rem', color: '#94a3b8' }}>
                      YOUR BIDDING STATUS
                    </h3>
                    {(() => {
                      const userBids = bidsList.filter(bid => bid.bidder_name === user?.name);
                      const userHighestBid = userBids.length > 0 ? Math.max(...userBids.map(b => b.amount)) : 0;

                      if (userHighestBid === 0) {
                        return (
                          <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                            You have not placed any bids on this item yet. Enter an amount above to start bidding.
                          </p>
                        );
                      }

                      const isWinning = currentPriceVal === userHighestBid;

                      return (
                        <div 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '14px 18px', 
                            background: isWinning ? 'rgba(74, 222, 128, 0.04)' : 'rgba(239, 68, 68, 0.04)', 
                            border: isWinning ? '1px solid rgba(74, 222, 128, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
                            borderRadius: '12px' 
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Your Highest Offer
                            </span>
                            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', marginTop: '4px', display: 'block' }}>
                              {symbol}{userHighestBid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          
                          <span 
                            style={{ 
                              fontSize: '0.8rem', 
                              fontWeight: 'bold', 
                              padding: '6px 14px', 
                              borderRadius: '20px', 
                              background: isWinning ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)', 
                              color: isWinning ? '#4ade80' : '#f87171',
                              border: isWinning ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(239,68,68,0.2)'
                            }}
                          >
                            {isWinning ? '🥇 WINNING' : '❌ OUTBID'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

export default AuctionDetails;
