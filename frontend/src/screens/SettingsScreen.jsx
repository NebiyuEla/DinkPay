import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SettingsScreen = ({ user, isLoading, onBack, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  }, [user]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim()) {
      alert('Username and email are required.');
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }

    onSave({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{ padding: '12px 0 24px', height: '100%', overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '21px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(73,250,132,0.15)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Settings</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.54)', fontSize: '13px' }}>
            Update your username, email, and password
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '18px' }}>
        <div style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
              Username
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.fullName}
              onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Your username"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
              Email
            </label>
            <input
              type="email"
              className="input-field"
              value={formData.email}
              onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@gmail.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
              Current password
            </label>
            <input
              type="password"
              className="input-field"
              value={formData.currentPassword}
              onChange={(event) => setFormData((current) => ({ ...current, currentPassword: event.target.value }))}
              placeholder={user?.telegramId ? 'Optional for Telegram users' : 'Required to change password'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
              New password
            </label>
            <input
              type="password"
              className="input-field"
              value={formData.newPassword}
              onChange={(event) => setFormData((current) => ({ ...current, newPassword: event.target.value }))}
              placeholder="Leave empty to keep current password"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
              Confirm new password
            </label>
            <input
              type="password"
              className="input-field"
              value={formData.confirmPassword}
              onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
              placeholder="Repeat the new password"
            />
          </div>
        </div>

        <div
          style={{
            marginTop: '16px',
            marginBottom: '16px',
            padding: '14px',
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.56)',
            lineHeight: 1.6,
            fontSize: '13px'
          }}
        >
          Keep your email current so payment receipts and support follow-ups reach the right place.
        </div>

        <button type="submit" className="primary-button" disabled={isLoading}>
          {isLoading ? 'Saving changes...' : 'Save Changes'}
        </button>
      </form>
    </motion.div>
  );
};

export default SettingsScreen;
