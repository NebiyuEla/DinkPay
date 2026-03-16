import React, { useState } from 'react';
import { motion } from 'framer-motion';

const OrdersScreen = ({ orders, onBack }) => {
  const [activeTab, setActiveTab] = useState('pending');

  const sampleOrders = {
    pending: [
      { id: 1, service: 'Netflix', plan: 'Premium', amount: 1250, date: 'Oct 28, 2023', txId: 'TXN-8F3K2M1P' },
      { id: 2, service: 'Spotify', plan: 'Family', amount: 925, date: 'Oct 27, 2023', txId: 'TXN-7G2J1L9K' }
    ],
    completed: [
      { id: 3, service: 'ChatGPT', plan: 'Plus', amount: 3700, date: 'Oct 26, 2023', txId: 'TXN-5D4F6G7H' }
    ],
    history: [
      { id: 4, service: 'Amazon', plan: 'Monthly', amount: 550, date: 'Oct 20, 2023', txId: 'TXN-3B4N5M6Q' }
    ]
  };

  const displayOrders = orders?.length ? orders : sampleOrders[activeTab];

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
        <h1 style={styles.title}>My Orders</h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer} className="tab-container">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </button>
        <button
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {/* Orders List */}
      <div style={styles.list}>
        {displayOrders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={styles.orderCard}
          >
            <div style={styles.orderHeader}>
              <span style={styles.orderService}>{order.service}</span>
              <span className={`badge badge-${activeTab === 'pending' ? 'pending' : 'success'}`}>
                {activeTab === 'pending' ? 'Pending' : 'Completed'}
              </span>
            </div>
            <div style={styles.orderDetails}>
              <span style={styles.orderPlan}>{order.plan}</span>
              <span style={styles.orderAmount}>{order.amount} ETB</span>
            </div>
            <div style={styles.orderFooter}>
              <span style={styles.orderDate}>{order.date}</span>
              <span style={styles.orderTx}>{order.txId}</span>
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
  tabContainer: {
    marginBottom: '20px'
  },
  list: {
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
    marginBottom: '8px'
  },
  orderPlan: {
    fontSize: '13px',
    color: '#8E8E93'
  },
  orderAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4FFFB0'
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#8E8E93'
  },
  orderDate: {},
  orderTx: {
    fontFamily: 'monospace'
  }
};

export default OrdersScreen;