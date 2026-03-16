import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ProfileModal = ({ user, orders, notifications, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const totalSpent = orders?.reduce((sum, o) => sum + o.amount, 0) || 0;
  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.overlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="glass-card"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Profile</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabContainer} className="tab-container">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={styles.profileContent}>
            <div style={styles.avatar}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <h3 style={styles.userName}>{user?.name || 'Ababe K.'}</h3>
            <p style={styles.userEmail}>{user?.email || 'ababe.k@gmail.com'}</p>

            <div style={styles.statsGrid}>
              <div className="glass-card" style={styles.statCard}>
                <span style={styles.statValue}>{totalOrders}</span>
                <span style={styles.statLabel}>Orders</span>
              </div>
              <div className="glass-card" style={styles.statCard}>
                <span style={styles.statValue}>{totalSpent} ETB</span>
                <span style={styles.statLabel}>Spent</span>
              </div>
              <div className="glass-card" style={styles.statCard}>
                <span style={styles.statValue}>{pendingOrders}</span>
                <span style={styles.statLabel}>Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div style={styles.ordersList}>
            {orders?.length > 0 ? orders.map(order => (
              <div key={order.id} className="glass-card" style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <span style={styles.orderService}>{order.service}</span>
                  <span className={`badge badge-${order.status === 'pending' ? 'pending' : 'success'}`}>
                    {order.status}
                  </span>
                </div>
                <div style={styles.orderDetails}>
                  <span>{order.plan}</span>
                  <span style={styles.orderAmount}>{order.amount} ETB</span>
                </div>
                <div style={styles.orderFooter}>
                  <span>{order.date}</span>
                  <span>{order.transactionId}</span>
                </div>
              </div>
            )) : (
              <p style={styles.noOrders}>No orders yet</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    zIndex: 1300
  },
  modal: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '100%',
    maxWidth: '320px',
    height: '100vh',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    padding: '24px',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  closeButton: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(79,255,176,0.15)',
    color: '#FFFFFF',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabContainer: {
    marginBottom: '24px'
  },
  profileContent: {
    textAlign: 'center'
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '32px',
    background: 'linear-gradient(135deg, #4FFFB0, #2ECC71)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    fontSize: '24px',
    fontWeight: '600',
    color: '#0A0F1E'
  },
  userName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: '4px'
  },
  userEmail: {
    fontSize: '13px',
    color: '#8E8E93',
    marginBottom: '24px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  statCard: {
    padding: '16px 8px',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#4FFFB0',
    display: 'block',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '11px',
    color: '#8E8E93'
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  orderCard: {
    padding: '16px'
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  orderService: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  orderDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#8E8E93'
  },
  orderAmount: {
    color: '#4FFFB0',
    fontWeight: '600'
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#8E8E93'
  },
  noOrders: {
    textAlign: 'center',
    color: '#8E8E93',
    padding: '40px 0'
  }
};

export default ProfileModal;