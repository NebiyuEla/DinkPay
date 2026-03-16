import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PaymentModal = ({ service, plan, user, onClose, onComplete, pendingCredentials }) => {
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      const orderData = {
        orderId: 'ORD-' + Date.now().toString().slice(-8),
        user: {
          name: user?.name || user?.fullName || 'Customer',
          email: user?.email || 'customer@email.com',
          phone: phoneNumber
        },
        service: {
          name: service.name,
          plan: plan.name,
          price: plan.price
        },
        credentials: pendingCredentials || {},  // ✅ Use pendingCredentials
        status: 'pending'
      };

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      
      if (data.success) {
        onComplete(data.order);
        onClose();
      }
    } catch (error) {
      console.error('Order failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.overlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="glass-card"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <h2 style={styles.title}>Order Summary</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Service</span>
            <span style={styles.summaryValue}>{service.name}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Plan</span>
            <span style={styles.summaryValue}>{plan.name}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Price</span>
            <span style={{...styles.summaryValue, color: '#4FFFB0'}}>{plan.price} ETB</span>
          </div>
        </div>

        {/* Show credentials if they exist */}
        {pendingCredentials && Object.keys(pendingCredentials).length > 0 && (
          <div style={styles.credentialsBox}>
            <h4 style={{ color: '#49FA84', marginBottom: '8px' }}>Account Credentials</h4>
            {Object.entries(pendingCredentials).map(([key, value]) => (
              <div key={key} style={styles.credentialRow}>
                <span>{key}:</span>
                <span style={{ color: 'white' }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Phone Number (Chapa)</label>
          <input
            type="tel"
            placeholder="0912 345 678"
            className="glass-input"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <button
          className="premium-button"
          onClick={handlePayment}
          disabled={processing || !phoneNumber}
        >
          {processing ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <i className="fas fa-spinner spinner"></i>
              Processing...
            </span>
          ) : (
            `Pay ${plan.price} ETB with Chapa`
          )}
        </button>
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
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1100
  },
  modal: {
    width: '100%',
    maxWidth: '375px',
    padding: '24px',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '18px',
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
  summaryCard: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '20px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#8E8E93'
  },
  summaryValue: {
    fontSize: '14px',
    color: '#FFFFFF'
  },
  credentialsBox: {
    background: 'rgba(73,250,132,0.1)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    border: '1px solid rgba(73,250,132,0.3)'
  },
  credentialRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '13px',
    color: '#8E8E93'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#8E8E93',
    marginBottom: '6px'
  }
};

export default PaymentModal;