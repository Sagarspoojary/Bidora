import React, { useState } from 'react';
import { motion } from 'framer-motion';
import auctionService from '../services/auctionService';

export function CreateAuction() {
  // Form fields
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('24'); // Default 24 hours
  const [imageFile, setImageFile] = useState(null);

  // Status & Validation states
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdItem, setCreatedItem] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Item name is required';
    else if (name.trim().length < 4) newErrors.name = 'Name must be at least 4 characters';

    if (!desc.trim()) newErrors.desc = 'Description is required';
    else if (desc.trim().length < 15) newErrors.desc = 'Description must be at least 15 characters';

    if (!price) newErrors.price = 'Starting price is required';
    else {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        newErrors.price = 'Starting price must be a positive number';
      }
    }

    if (!duration) newErrors.duration = 'Auction duration is required';
    else {
      const hours = parseInt(duration);
      if (isNaN(hours) || hours <= 0 || hours > 168) {
        newErrors.duration = 'Duration must be between 1 and 168 hours (1 week)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const endTime = new Date(Date.now() + parseInt(duration) * 60 * 60 * 1000).toISOString();
      const startPrice = parseFloat(price);
      
      const newAuctionData = {
        title: name,
        description: desc,
        image_url: '/images/luxury_watch.jpg', // fallback image asset
        starting_price: startPrice,
        end_time: endTime,
        start_time: new Date().toISOString(),
      };

      const result = await auctionService.create(newAuctionData);
      setCreatedItem(result);
      setIsSuccess(true);
      
      // Reset form
      setName('');
      setDesc('');
      setPrice('');
      setDuration('24');
      setImageFile(null);
    } catch (err) {
      console.error('Failed to create auction:', err);
      setErrors({ general: 'Failed to create auction. Please try again.' });
    } finally {
      setLoading(false);
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
        <h2 className="welcome-title">Create Auction</h2>
        <p className="welcome-subtitle">Register a new premium asset in the bidding pipeline.</p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.div 
          className="glass-card create-auction-form-card"
          style={{ width: '100%', maxWidth: '520px', padding: '36px', textAlign: 'left' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          {isSuccess ? (
            <motion.div 
              className="creation-success-state"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ textAlign: 'center' }}
            >
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '16px' }}>✓</span>
              <h3 style={{ color: '#34d399', marginBottom: '12px', fontSize: '1.4rem' }}>Auction Prepared Successfully</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
                Your item <strong>"{createdItem?.title}"</strong> has been registered. 
                <br />
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '8px' }}>
                  (Note: Placed locally. Full database persistence will activate in the next backend phase).
                </span>
              </p>
              <button 
                type="button" 
                onClick={() => setIsSuccess(false)} 
                className="btn-primary"
              >
                Create Another Auction
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form" style={{ gap: '20px' }}>
              {errors.general && (
                <div className="alert alert-error">{errors.general}</div>
              )}

              {/* Upload Mock Container */}
              <div className="input-group">
                <label className="input-label">Item Display Image</label>
                <div className="image-upload-mock-box">
                  <span className="upload-icon">📷</span>
                  <span className="upload-label">Drag & drop or Click to upload asset image</span>
                  <span className="upload-sub">Recommended: 800x800px PNG or JPG (using default asset for local demo)</span>
                </div>
              </div>

              {/* Item Name */}
              <div className="input-group">
                <label className="input-label" htmlFor="auction-name">Item Name</label>
                <input 
                  id="auction-name"
                  type="text" 
                  className={`form-input ${errors.name ? 'input-invalid' : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vintage Leather Jacket, Rolex Submariner..."
                  required
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              {/* Description */}
              <div className="input-group">
                <label className="input-label" htmlFor="auction-desc">Detailed Description</label>
                <textarea 
                  id="auction-desc"
                  className={`form-input form-textarea ${errors.desc ? 'input-invalid' : ''}`}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Provide specifications, history, serial numbers, and condition..."
                  rows={4}
                  required
                />
                {errors.desc && <span className="field-error">{errors.desc}</span>}
              </div>

              {/* Pricing & Duration Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Starting Price */}
                <div className="input-group">
                  <label className="input-label" htmlFor="starting-price">Starting Price ($)</label>
                  <input 
                    id="starting-price"
                    type="number" 
                    step="0.01"
                    className={`form-input ${errors.price ? 'input-invalid' : ''}`}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 1500.00"
                    required
                  />
                  {errors.price && <span className="field-error">{errors.price}</span>}
                </div>

                {/* Duration */}
                <div className="input-group">
                  <label className="input-label" htmlFor="auction-duration">Duration (Hours)</label>
                  <select
                    id="auction-duration"
                    className={`form-input ${errors.duration ? 'input-invalid' : ''}`}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours (1 Day)</option>
                    <option value="48">48 Hours (2 Days)</option>
                    <option value="72">72 Hours (3 Days)</option>
                    <option value="168">168 Hours (1 Week)</option>
                  </select>
                  {errors.duration && <span className="field-error">{errors.duration}</span>}
                </div>
              </div>

              {/* Submit Button */}
              <motion.button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: '8px' }}
              >
                {loading ? 'Registering Item...' : 'Create Auction'}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default CreateAuction;
