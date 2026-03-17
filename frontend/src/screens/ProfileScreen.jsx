import React from 'react';
import { motion } from 'framer-motion';
import { BOT_VERSION, SUPPORT_PHONE, SUPPORT_TELEGRAM, TERMS_VERSION } from '../data/legal';
import { formatEtb } from '../utils/format';

const ProfileScreen = ({
  user,
  orders,
  onLogout,
  onBack,
  onOrdersClick,
  onNotificationsClick,
  onSettingsClick,
  onTermsClick
}) => {
  const totalOrders = orders?.length || 0;
  const totalSpent =
    orders
      ?.filter((order) => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + (order.totalAmount || order.amount || 0), 0) || 0;
  const activeOrders =
    orders?.filter((order) => order.paymentStatus === 'paid' && !['completed', 'cancelled'].includes(order.status)).length || 0;
  const visiblePhone = user?.phone && !String(user.phone).startsWith('tg-') ? user.phone : '';

  const menuItems = [
    { icon: 'fa-shopping-bag', label: 'My Orders', onClick: onOrdersClick },
    { icon: 'fa-bell', label: 'Notifications', onClick: onNotificationsClick },
    { icon: 'fa-gear', label: 'Settings', onClick: onSettingsClick },
    { icon: 'fa-file-contract', label: 'Terms & Support', onClick: onTermsClick }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{ padding: '12px 0 24px', height: '100%', overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(73,250,132,0.15)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Profile</h1>
      </div>

      <div className="profile-circle">
        {(user?.fullName || user?.name || 'U').charAt(0)}
      </div>

      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>
          {user?.fullName || user?.name || 'User Name'}
        </h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
          {user?.email || 'user@gmail.com'}
        </p>
        {visiblePhone ? (
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
            {visiblePhone}
          </p>
        ) : null}
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.36)', margin: 0 }}>
          {user?.telegramUsername ? `@${String(user.telegramUsername).replace(/^@/, '')}` : 'DINK Pay customer'}
        </p>
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <span className="stat-value">{totalOrders}</span>
          <span className="stat-label">Orders</span>
        </div>
        <div className="glass-card stat-card">
          <span className="stat-value">{formatEtb(totalSpent)}</span>
          <span className="stat-label">Spent</span>
        </div>
        <div className="glass-card stat-card">
          <span className="stat-value">{activeOrders}</span>
          <span className="stat-label">Active</span>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '16px' }}>
        {menuItems.map((item) => (
          <div key={item.label} className="menu-item" onClick={item.onClick}>
            <div className="menu-item-left">
              <i className={`fas ${item.icon} menu-item-icon`}></i>
              <span className="menu-item-label">{item.label}</span>
            </div>
            <i className="fas fa-chevron-right menu-item-arrow"></i>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '18px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Terms & Support</h3>
          <button
            type="button"
            onClick={onTermsClick}
            style={{
              border: 'none',
              background: 'rgba(73,250,132,0.12)',
              color: '#49FA84',
              borderRadius: '999px',
              padding: '8px 12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Open terms
          </button>
        </div>
        <div style={{ display: 'grid', gap: '10px', color: 'rgba(255,255,255,0.68)', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span>Phone</span>
            <strong style={{ color: 'white' }}>{SUPPORT_PHONE}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span>Telegram</span>
            <strong style={{ color: 'white' }}>{SUPPORT_TELEGRAM}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span>Terms version</span>
            <strong style={{ color: 'white' }}>{TERMS_VERSION}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span>Bot version</span>
            <strong style={{ color: 'white' }}>{BOT_VERSION}</strong>
          </div>
        </div>
      </div>

      <button
        className="secondary-button"
        onClick={onLogout}
        style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444', marginBottom: '18px' }}
      >
        <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i>
        Logout
      </button>
    </motion.div>
  );
};

export default ProfileScreen;
