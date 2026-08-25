import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const { register, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    const localErrors = {};
    if (name.trim().length < 2) {
      localErrors.name = 'Name must be at least 2 characters';
    }
    if (password.length < 6) {
      localErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      localErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    const res = await register(name, email, password);
    if (res.success) {
      window.location.hash = '#/profile';
    } else {
      if (res.errors) {
        setErrors(res.errors);
      } else {
        setGeneralError(res.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="auth-card-container">
      <div className="glass-card">
        <header className="brand-header">
          <h1 className="logo">BIDORA</h1>
          <p className="subtitle">Every Bid. One Winner.</p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="section-title">Create Account</h2>

          {generalError && <div className="alert alert-error">{generalError}</div>}

          <div className="input-group">
            <label className="input-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              className={`form-input ${errors.name ? 'input-invalid' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className={`form-input ${errors.email ? 'input-invalid' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-password">Password (min 6 chars)</label>
            <input
              id="reg-password"
              type="password"
              className={`form-input ${errors.password ? 'input-invalid' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-confirm-password">Confirm Password</label>
            <input
              id="reg-confirm-password"
              type="password"
              className={`form-input ${errors.confirmPassword ? 'input-invalid' : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Register Entry'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <a href="#/login" className="auth-link">Sign In Here</a></p>
        </div>
      </div>
    </div>
  );
}

export default Register;
