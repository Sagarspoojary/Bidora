import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      window.location.hash = '#/profile';
    } else {
      setErrorMsg(res.error || 'Invalid credentials');
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
          <h2 className="section-title">Sign In</h2>

          {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

          <div className="input-group">
            <label className="input-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="login-password">Password</label>
            <div className="password-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '🕶️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Place Entry Credentials'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Or Continue With</span>
        </div>

        <div className="oauth-grid">
          <button className="oauth-btn" disabled>
            <span className="oauth-icon">🌐</span> Google (Unavailable)
          </button>
          <button className="oauth-btn" disabled>
            <span className="oauth-icon">🐙</span> GitHub (Unavailable)
          </button>
        </div>

        <div className="auth-footer">
          <p>Don't have an account? <a href="#/register" className="auth-link">Register Here</a></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
