import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import auctionService from '../services/auctionService';

export function MyAuctions() {
  const [myAuctions, setMyAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteStatus, setDeleteStatus] = useState('');

  // Edit/Manage modal states
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [saving, setSaving] = useState(false);

  const handleOpenManage = (item) => {
    setEditingItem(item);
    setEditName(item.title);
    setEditDesc(item.description || '');
    setEditPrice(item.starting_price);
    setEditCurrency(item.currency || 'USD');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editDesc.trim() || !editPrice) return;

    try {
      setSaving(true);
      await auctionService.update(editingItem.id, {
        title: editName,
        description: editDesc,
        starting_price: Number(editPrice),
        currency: editCurrency
      });
      setEditingItem(null);
      await loadMyAuctions();
    } catch (err) {
      console.error('Failed to update auction:', err);
      alert('Failed to update auction item.');
    } finally {
      setSaving(false);
    }
  };

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

  useEffect(() => {
    loadMyAuctions();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this auction item?')) {
      try {
        await auctionService.delete(id);
        setDeleteStatus('Auction deleted successfully!');
        // Reload list
        await loadMyAuctions();
        
        // Auto clear message
        setTimeout(() => setDeleteStatus(''), 3000);
      } catch (err) {
        console.error('Failed to delete auction:', err);
        alert('Failed to delete auction.');
      }
    }
  };

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

      {deleteStatus && (
        <motion.div 
          className="alert alert-success"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px', textAlign: 'left', maxWidth: '400px' }}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {deleteStatus}
        </motion.div>
      )}

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
          <AnimatePresence>
            {myAuctions.map((item, idx) => (
              <motion.div 
                key={item.id} 
                className="workspace-item-card glass-card"
                style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 100 }}
                layout
              >
                {/* Catalog Image Banner */}
                <div className="catalog-image-wrap" style={{ height: '150px' }}>
                  <img src={item.image_url || '/images/luxury_watch.jpg'} alt={item.title} className="catalog-img" />
                  <span className="catalog-status-badge">{item.status || 'LIVE'}</span>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div className="workspace-card-header" style={{ marginBottom: '12px' }}>
                    <h4 className="workspace-item-title">{item.title}</h4>
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
                    const symbol = getCurrencySymbol(item.currency);
                    return (
                      <div className="workspace-bid-meta">
                        <div className="meta-price-box">
                          <span className="meta-price-label">STARTING PRICE</span>
                          <span className="meta-price-val">{symbol}{Number(item.starting_price).toLocaleString('en-US')}</span>
                        </div>

                        <div className="meta-price-box">
                          <span className="meta-price-label">CURRENT HIGHEST BID</span>
                          <span className="meta-price-val price-glow-gold">
                            {symbol}{Number(item.current_price).toLocaleString('en-US')}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="workspace-card-footer">
                    <span className="workspace-time-remaining">
                      {item.bids_count !== undefined ? `Bids Placed: ${item.bids_count}` : 'Ends In: 24h'}
                    </span>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      className="btn-workspace-action" 
                      onClick={() => handleOpenManage(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      Manage
                    </button>
                    <button 
                      type="button" 
                      className="btn-workspace-action btn-delete-action"
                      onClick={() => handleDelete(item.id)}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        color: '#f87171', 
                        cursor: 'pointer', 
                        padding: '8px 16px', 
                        borderRadius: '8px', 
                        fontSize: '0.8rem', 
                        fontWeight: '700',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.target.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}
      {editingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <motion.div 
            className="glass-card" 
            style={{ width: '90%', maxWidth: '500px', padding: '32px', textAlign: 'left', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="welcome-title" style={{ fontSize: '1.4rem', marginBottom: '20px', color: '#fff' }}>Manage Auction Item</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Item Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  required 
                />
              </div>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Description</label>
                <textarea 
                  className="form-input form-textarea" 
                  value={editDesc} 
                  onChange={(e) => setEditDesc(e.target.value)} 
                  rows={4} 
                  required 
                />
              </div>
              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Starting Price</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="form-input"
                    style={{ width: '95px', padding: '10px', fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0 }}
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-input" 
                    style={{ flexGrow: 1 }}
                    value={editPrice} 
                    onChange={(e) => setEditPrice(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn-workspace-action" 
                  onClick={() => setEditingItem(null)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: '10px 18px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ maxWidth: '160px', padding: '10px 20px', fontSize: '0.85rem' }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default MyAuctions;
