import React, { useState } from 'react';
import { motion } from 'framer-motion';
import auctionService from '../services/auctionService';

export function CreateAuction() {
  // Form fields
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [duration, setDuration] = useState('24'); // Default 24 hours
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = React.useRef(null);

  // Status & Validation states
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdItem, setCreatedItem] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, image: 'Please select a valid image file.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(file);
        setImagePreview(reader.result);
        const newErrors = { ...errors };
        delete newErrors.image;
        setErrors(newErrors);
      };
      reader.readAsDataURL(file);
    }
  };

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
      const hours = parseFloat(duration);
      if (isNaN(hours) || hours <= 0 || hours > 168) {
        newErrors.duration = 'Duration must be between 2 minutes and 168 hours (1 week)';
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
      const hoursVal = parseFloat(duration);
      const endTime = new Date(Date.now() + hoursVal * 60 * 60 * 1000).toISOString();
      const startPrice = parseFloat(price);
      
      const newAuctionData = {
        title: name,
        description: desc,
        image_url: imagePreview || '/images/luxury_watch.jpg',
        starting_price: startPrice,
        currency: currency,
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
      setCurrency('USD');
      setDuration('24');
      setImageFile(null);
      setImagePreview('');
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

              {/* Upload Container */}
              <div className="input-group">
                <label className="input-label">Item Display Image</label>
                <input 
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <div 
                  className="image-upload-mock-box"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ overflow: 'hidden', padding: imagePreview ? '0' : '28px 20px', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                >
                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '100%', height: '180px' }}>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div className="upload-overlay-text" style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(15, 23, 42, 0.85)', color: '#fff', fontSize: '0.8rem', padding: '8px', textAlign: 'center', fontWeight: '600' }}>
                        Click to change image
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="upload-icon">📷</span>
                      <span className="upload-label">Drag & drop or Click to upload asset image</span>
                      <span className="upload-sub">Recommended: 800x800px PNG or JPG</span>
                    </>
                  )}
                </div>
                {errors.image && <span className="field-error">{errors.image}</span>}
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
                  <label className="input-label" htmlFor="starting-price">Starting Price</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      id="currency-select"
                      className="form-input"
                      style={{ width: '95px', padding: '10px', fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0 }}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    <input 
                      id="starting-price"
                      type="number" 
                      step="0.01"
                      className={`form-input ${errors.price ? 'input-invalid' : ''}`}
                      style={{ flexGrow: 1 }}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 1500.00"
                      required
                    />
                  </div>
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
                    <option value="0.033333">2 Minutes (Testing)</option>
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
