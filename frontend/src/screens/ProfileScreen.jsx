import React from 'react';
import { motion } from 'framer-motion';

const ProfileScreen = ({ user, orders, onLogout, onBack, onOrdersClick, onNotificationsClick }) => {
  // Calculate stats
  const totalOrders = orders?.length || 0;
  const totalSpent = orders?.reduce((sum, o) => sum + (o.totalAmount || o.amount || 0), 0) || 0;
  const pendingOrders =
    orders?.filter((order) => order.paymentStatus === 'paid' && !['completed', 'cancelled'].includes(order.status)).length || 0;

  // Menu items (NO SETTINGS)
  const menuItems = [
    { icon: 'fa-shopping-bag', label: 'My Orders', onClick: onOrdersClick },
    { icon: 'fa-bell', label: 'Notifications', onClick: onNotificationsClick }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{ padding: '12px 0 20px', height: '100%', overflowY: 'auto' }}
    >
      {/* Header */}
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
        <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Profile</h1>
      </div>

      {/* Avatar */}
      <div className="profile-circle">
        {(user?.fullName || user?.name || 'U').charAt(0)}
      </div>

      {/* User Info */}
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>
          {user?.fullName || user?.name || 'User Name'}
        </h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
          {user?.email || 'user@email.com'}
        </p>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>
          <i className="fas fa-phone" style={{ marginRight: '8px', color: '#49FA84' }}></i>
          {user?.phone || '+251 912 345 678'}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <span className="stat-value">{totalOrders}</span>
          <span className="stat-label">Orders</span>
        </div>
        <div className="glass-card stat-card">
          <span className="stat-value">{totalSpent} ETB</span>
          <span className="stat-label">Spent</span>
        </div>
        <div className="glass-card stat-card">
          <span className="stat-value">{pendingOrders}</span>
          <span className="stat-label">Active</span>
        </div>
      </div>

      {/* Menu (NO SETTINGS) */}
      <div className="glass-card" style={{ marginBottom: '16px' }}>
        {menuItems.map((item, index) => (
          <div
            key={item.label}
            className="menu-item"
            onClick={item.onClick}
          >
            <div className="menu-item-left">
              <i className={`fas ${item.icon} menu-item-icon`}></i>
              <span className="menu-item-label">{item.label}</span>
            </div>
            <i className="fas fa-chevron-right menu-item-arrow"></i>
          </div>
        ))}
      </div>

      {/* Logout Button */}
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
