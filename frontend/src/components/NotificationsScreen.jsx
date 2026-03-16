import React from 'react';
import { motion } from 'framer-motion';

const NotificationsScreen = ({ notifications, onBack }) => {
  const sampleNotifications = [
    {
      id: 1,
      user: 'Ababe K.',
      message: 'Your Netflix subscription is now active',
      time: 'Oct 28, 2023',
      type: 'success'
    },
    {
      id: 2,
      user: 'Ababe K.',
      message: 'Payment of 1250 ETB received',
      time: 'Oct 28, 2023',
      type: 'success'
    },
    {
      id: 3,
      user: 'Ababe K.',
      message: 'Order is being processed',
      time: 'Oct 27, 2023',
      type: 'pending'
    }
  ];

  const displayNotifications = notifications?.length ? notifications : sampleNotifications;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.container}
    >
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 style={styles.title}>Notifications</h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Notifications List */}
      <div style={styles.list}>
        {displayNotifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={styles.notificationCard}
          >
            <div style={{
              ...styles.notificationIcon,
              background: notif.type === 'success' 
                ? 'rgba(40,167,69,0.2)' 
                : 'rgba(255,193,7,0.2)'
            }}>
              {notif.type === 'success' ? '✅' : '📢'}
            </div>
            <div style={styles.notificationContent}>
              <div style={styles.notificationHeader}>
                <span style={styles.notificationUser}>{notif.user}</span>
                {notif.type === 'pending' && (
                  <span className="badge badge-pending">Pending</span>
                )}
              </div>
              <p style={styles.notificationMessage}>{notif.message}</p>
              <span style={styles.notificationTime}>{notif.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0A0F1E',
    padding: '16px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  backButton: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(79,255,176,0.15)',
    color: '#FFFFFF',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  notificationCard: {
    padding: '16px',
    display: 'flex',
    gap: '12px'
  },
  notificationIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
  },
  notificationContent: {
    flex: 1
  },
  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  notificationUser: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  notificationMessage: {
    fontSize: '12px',
    color: '#8E8E93',
    marginBottom: '4px'
  },
  notificationTime: {
    fontSize: '10px',
    color: '#8E8E93'
  }
};

export default NotificationsScreen;