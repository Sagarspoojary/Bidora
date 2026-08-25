import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Profile() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  
  // Profile settings state
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });
    setProfileLoading(true);

    if (!name.trim()) {
      setProfileMsg({ text: 'Name cannot be blank', type: 'error' });
      setProfileLoading(false);
      return;
    }

    const res = await updateProfile(name, avatarUrl);
    setProfileLoading(false);
    if (res.success) {
      setProfileMsg({ text: 'Profile details updated successfully!', type: 'success' });
    } else {
      setProfileMsg({ text: res.error || 'Failed to update profile details', type: 'error' });
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPwdMsg({ text: '', type: '' });

    if (!currentPassword || !newPassword) {
      setPwdMsg({ text: 'Both passwords are required', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPwdMsg({ text: 'New password must be at least 6 characters long', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'Confirm password does not match new password', type: 'error' });
      return;
    }

    setPwdLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setPwdLoading(false);

    if (res.success) {
      setPwdMsg({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwdMsg({ text: res.error || 'Incorrect current password', type: 'error' });
    }
  };

  return (
    <div className="profile-container">
      <div className="glass-card profile-card">
        <header className="brand-header">
          <div className="profile-badge">
            <span className="profile-avatar-display">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="avatar-img" /> : '👤'}
            </span>
          </div>
          <h1 className="logo logo-profile">{user?.name}</h1>
          <p className="subtitle">Role: {user?.role} | Status: {user?.status}</p>
          <p className="user-email">{user?.email}</p>
        </header>

        <div className="profile-sections">
          {/* Section 1: Update Profile Details */}
          <form onSubmit={handleProfileUpdate} className="profile-form">
            <h2 className="section-title">Update Profile</h2>
            {profileMsg.text && (
              <div className={`alert alert-${profileMsg.type}`}>{profileMsg.text}</div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="prof-name">Display Name</label>
              <input
                id="prof-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="prof-avatar">Avatar URL</label>
              <input
                id="prof-avatar"
                type="text"
                className="form-input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="http://example.com/avatar.jpg"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Update Details'}
            </button>
          </form>

          {/* Section 2: Change Password */}
          <form onSubmit={handlePasswordUpdate} className="profile-form">
            <h2 className="section-title">Security Settings</h2>
            {pwdMsg.text && <div className={`alert alert-${pwdMsg.type}`}>{pwdMsg.text}</div>}

            <div className="input-group">
              <label className="input-label" htmlFor="pwd-current">Current Password</label>
              <input
                id="pwd-current"
                type="password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="pwd-new">New Password</label>
              <input
                id="pwd-new"
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="pwd-confirm">Confirm New Password</label>
              <input
                id="pwd-confirm"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={pwdLoading}>
              {pwdLoading ? 'Updating Password...' : 'Update Security'}
            </button>
          </form>
        </div>

        <footer className="profile-card-footer">
          <button className="btn-logout" onClick={logout}>
            Sign Out of Arena
          </button>
          <br />
          <a href="#/" className="auth-link font-small">Return to System Panel</a>
        </footer>
      </div>
    </div>
  );
}

export default Profile;
