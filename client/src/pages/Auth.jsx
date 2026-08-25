import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export function Auth() {
  const { user, login, register, logout, forgotPassword, resetPassword, loginWithGoogle, loading } = useAuth();
  
  // View states
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regErrors, setRegErrors] = useState({});
  const [regGeneralError, setRegGeneralError] = useState('');

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState({ text: '', type: '' });

  // Reset Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState({ text: '', type: '' });

  // Google Login Callbacks
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoginError('');
    const res = await loginWithGoogle(credentialResponse.credential);
    if (!res.success) {
      setLoginError(res.error || 'Google authentication failed');
    }
  };

  const handleGoogleError = () => {
    setLoginError('Google Sign-In failed');
  };

  // Track Hash routing to determine if we are in Reset Password mode
  useEffect(() => {
    const checkHashMode = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/reset-password')) {
        setIsResetPassword(true);
        // Extract token
        if (hash.includes('?')) {
          const query = hash.split('?')[1];
          const urlParams = new URLSearchParams(query);
          setResetToken(urlParams.get('token') || '');
        }
      } else {
        setIsResetPassword(false);
      }
    };
    
    checkHashMode();
    window.addEventListener('hashchange', checkHashMode);
    return () => window.removeEventListener('hashchange', checkHashMode);
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password');
      return;
    }

    const res = await login(loginEmail, loginPassword);
    if (!res.success) {
      setLoginError(res.error || 'Invalid credentials');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegErrors({});
    setRegGeneralError('');

    const localErrors = {};
    if (regName.trim().length < 2) {
      localErrors.name = 'Name must be at least 2 characters';
    }
    if (regPassword.length < 6) {
      localErrors.password = 'Password must be at least 6 characters';
    }
    if (regPassword !== regConfirmPassword) {
      localErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(localErrors).length > 0) {
      setRegErrors(localErrors);
      return;
    }

    const res = await register(regName, regEmail, regPassword);
    if (!res.success) {
      if (res.errors) {
        setRegErrors(res.errors);
      } else {
        setRegGeneralError(res.message || 'Registration failed');
      }
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotMsg({ text: '', type: '' });
    setLoginSuccess('');

    if (!forgotEmail) {
      setForgotMsg({ text: 'Please enter your email address', type: 'error' });
      return;
    }

    const res = await forgotPassword(forgotEmail);
    if (res.success) {
      setLoginSuccess(res.message || 'If the email is registered, a password reset link has been dispatched.');
      setForgotEmail('');
      setIsForgotPassword(false);

      // Auto-dismiss the success message after 4 seconds
      setTimeout(() => {
        setLoginSuccess('');
      }, 4000);
    } else {
      setForgotMsg({ text: res.error || 'Failed to dispatch reset link', type: 'error' });
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetMsg({ text: '', type: '' });

    if (!newPassword || !confirmNewPassword) {
      setResetMsg({ text: 'Please fill in both fields', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setResetMsg({ text: 'Password must be at least 6 characters long', type: 'error' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetMsg({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    const res = await resetPassword(resetToken, newPassword);
    if (res.success) {
      setResetMsg({ text: res.message || 'Password reset successfully!', type: 'success' });
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        window.location.hash = '#/login';
      }, 2500);
    } else {
      setResetMsg({ text: res.error || 'Failed to reset password', type: 'error' });
    }
  };

  // 1. Authenticated Welcome View
  if (user) {
    return (
      <div className="auth-card-container">
        <div className="stars"></div>
        <div className="glowing-orb orb-1"></div>
        <div className="glowing-orb orb-2"></div>

        <motion.div 
          className="glass-card auth-premium-card"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
          <header className="brand-header">
            <div className="profile-badge" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <span className="profile-avatar-display" style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                👤
              </span>
            </div>
            <h1 className="logo logo-profile" style={{ fontSize: '2rem' }}>WELCOME BACK</h1>
            <p className="subtitle" style={{ color: '#34d399', fontWeight: 600 }}>✓ Authenticated in Arena</p>
          </header>

          <div className="auth-form" style={{ gap: '12px', margin: '20px 0', textAlign: 'left', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '16px', borderRadius: '12px' }}>
            <p style={{ margin: '4px 0', fontSize: '0.95rem' }}><strong style={{ color: '#cbd5e1' }}>Name:</strong> {user.name}</p>
            <p style={{ margin: '4px 0', fontSize: '0.95rem' }}><strong style={{ color: '#cbd5e1' }}>Email:</strong> {user.email}</p>
            <p style={{ margin: '4px 0', fontSize: '0.95rem' }}><strong style={{ color: '#cbd5e1' }}>Role:</strong> {user.role}</p>
            <p style={{ margin: '4px 0', fontSize: '0.95rem' }}><strong style={{ color: '#cbd5e1' }}>Status:</strong> {user.status}</p>
          </div>

          <motion.button 
            onClick={logout} 
            className="btn-primary" 
            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.25)' }}
            whileTap={{ scale: 0.98 }}
          >
            Sign Out of Arena
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // 2. Reset Password View
  if (isResetPassword) {
    return (
      <div className="auth-card-container">
        <div className="stars"></div>
        <div className="glowing-orb orb-1"></div>
        <div className="glowing-orb orb-2"></div>

        <motion.div 
          className="glass-card auth-premium-card"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
          <header className="brand-header">
            <h1 className="logo">BIDORA</h1>
            <p className="subtitle">Reset Security Credentials</p>
          </header>

          <form onSubmit={handleResetPasswordSubmit} className="auth-form">
            <h2 className="section-title">Change Password</h2>

            {resetMsg.text && (
              <div className={`alert alert-${resetMsg.type}`}>{resetMsg.text}</div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="reset-new-password">New Password</label>
              <input
                id="reset-new-password"
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reset-confirm-password">Confirm New Password</label>
              <input
                id="reset-confirm-password"
                type="password"
                className="form-input"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <motion.button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </motion.button>
          </form>

          <div className="auth-footer">
            <a href="#/login" className="auth-link">Return to Sign In</a>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Forgot Password View
  if (isForgotPassword) {
    return (
      <div className="auth-card-container">
        <div className="stars"></div>
        <div className="glowing-orb orb-1"></div>
        <div className="glowing-orb orb-2"></div>

        <motion.div 
          className="glass-card auth-premium-card"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
          <header className="brand-header">
            <h1 className="logo">BIDORA</h1>
            <p className="subtitle">Password Recovery</p>
          </header>

          <form onSubmit={handleForgotPasswordSubmit} className="auth-form">
            <h2 className="section-title">Recover Password</h2>

            {forgotMsg.text && (
              <div className={`alert alert-${forgotMsg.type}`}>{forgotMsg.text}</div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="forgot-email">Account Email Address</label>
              <input
                id="forgot-email"
                type="email"
                className="form-input"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <motion.button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Dispatching Link...' : 'Request Reset Link'}
            </motion.button>
          </form>

          <div className="auth-footer">
            <button 
              type="button" 
              className="btn-skip-intro" 
              style={{ margin: 0, color: '#60a5fa', textDecoration: 'underline' }}
              onClick={() => setIsForgotPassword(false)}
            >
              Return to Sign In
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. Default Login / Register tabs view
  return (
    <div className="auth-card-container">
      <div className="stars"></div>
      <div className="glowing-orb orb-1"></div>
      <div className="glowing-orb orb-2"></div>

      <motion.div 
        className="glass-card auth-premium-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      >
        <header className="brand-header">
          {/* Combined BD Monogram gold logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
              <path d="M 43,22 C 32,22 24,28 24,37 C 24,46 32,50 43,50 C 35,48 29,44 29,37 C 29,30 35,24 43,22 Z" fill="url(#gold-gradient)" />
              <path d="M 43,50 C 32,50 24,54 24,63 C 24,72 32,78 43,78 C 35,76 29,72 29,63 C 29,54 35,52 43,50 Z" fill="url(#gold-gradient)" />
              <path d="M 47,22 H 53 V 78 H 47 Z" fill="url(#gold-gradient)" />
              <path d="M 42,22 H 58 V 25 H 42 Z" fill="url(#gold-gradient)" />
              <path d="M 42,75 H 58 V 78 H 42 Z" fill="url(#gold-gradient)" />
              <path d="M 57,22 C 72,22 81,33 81,50 C 81,67 72,78 57,78 C 66,74 74,63 74,50 C 74,37 66,26 57,22 Z" fill="url(#gold-gradient)" />
              <defs>
                <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#ca8a04" />
                  <stop offset="100%" stopColor="#854d0e" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="logo">BIDORA</h1>
          <p className="subtitle">Every Bid. One Winner.</p>
        </header>

        {/* Dynamic Tab Switcher */}
        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab ${isLoginTab ? 'active' : ''}`}
            onClick={() => {
              setIsLoginTab(true);
              setRegGeneralError('');
              setRegErrors({});
              setLoginSuccess('');
            }}
          >
            Sign In
            {isLoginTab && <motion.div className="active-tab-indicator" layoutId="activeTab" />}
          </button>
          <button 
            type="button" 
            className={`auth-tab ${!isLoginTab ? 'active' : ''}`}
            onClick={() => {
              setIsLoginTab(false);
              setLoginError('');
              setLoginSuccess('');
            }}
          >
            Sign Up
            {!isLoginTab && <motion.div className="active-tab-indicator" layoutId="activeTab" />}
          </button>
        </div>

        {/* Forms Slide Transition */}
        <div className="auth-form-wrapper">
          <AnimatePresence mode="wait">
            {isLoginTab ? (
              <motion.form
                key="login-form"
                onSubmit={handleLoginSubmit}
                className="auth-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                {loginSuccess && (
                  <motion.div 
                    className="alert alert-success"
                    style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px', textAlign: 'left' }}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {loginSuccess}
                  </motion.div>
                )}

                {loginError && (
                  <motion.div 
                    className="alert alert-error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {loginError}
                  </motion.div>
                )}

                <div className="input-group">
                  <label className="input-label" htmlFor="login-email">Email Address</label>
                  <input
                    id="login-email"
                    type="email"
                    className="form-input"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
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
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPassword(true)}
                    className="auth-link" 
                    style={{ fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, alignSelf: 'flex-start', marginTop: '2px' }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <motion.button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Entering Arena...' : 'Place Entry Credentials'}
                </motion.button>

                <div className="auth-divider">
                  <span>Or Secure Enter With</span>
                </div>

                <div className="oauth-grid" style={{ gridTemplateColumns: '1fr', display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_dark"
                    shape="pill"
                    width="370"
                  />
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                onSubmit={handleRegisterSubmit}
                className="auth-form"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
              >
                {regGeneralError && (
                  <motion.div 
                    className="alert alert-error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {regGeneralError}
                  </motion.div>
                )}

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-name">Full Name</label>
                  <input
                    id="reg-name"
                    type="text"
                    className={`form-input ${regErrors.name ? 'input-invalid' : ''}`}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                  {regErrors.name && <span className="field-error">{regErrors.name}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-email">Email Address</label>
                  <input
                    id="reg-email"
                    type="email"
                    className={`form-input ${regErrors.email ? 'input-invalid' : ''}`}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                  {regErrors.email && <span className="field-error">{regErrors.email}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-password">Password (min 6 chars)</label>
                  <input
                    id="reg-password"
                    type="password"
                    className={`form-input ${regErrors.password ? 'input-invalid' : ''}`}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  {regErrors.password && <span className="field-error">{regErrors.password}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-confirm-password">Confirm Password</label>
                  <input
                    id="reg-confirm-password"
                    type="password"
                    className={`form-input ${regErrors.confirmPassword ? 'input-invalid' : ''}`}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  {regErrors.confirmPassword && <span className="field-error">{regErrors.confirmPassword}</span>}
                </div>

                <motion.button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Creating Account...' : 'Register Entry'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default Auth;
