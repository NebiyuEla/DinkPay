import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ReceiptModal = ({ service, plan, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    // Processing animation
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setShowReceipt(true), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(timer);
  }, []);

  const transactionId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const date = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Processing Screen
  if (!showReceipt) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.overlay}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="glass-card"
          style={styles.processingModal}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.progressContainer}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(79,255,176,0.1)"
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#4FFFB0"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="282.6"
                strokeDashoffset={282.6 - (282.6 * progress) / 100}
                style={{ rotate: -90, transformOrigin: 'center' }}
              />
            </svg>
            <span style={styles.progressIcon}>⏳</span>
          </div>
          
          <h2 style={styles.processingTitle}>Payment Processing</h2>
          <p style={styles.processingSubtitle}>Please wait</p>
          
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${progress}%`}} />
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Receipt Screen
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.overlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="glass-card"
        style={styles.receiptModal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.successIcon}>
          <i className="fas fa-check-circle" style={{ color: '#28A745', fontSize: '64px' }}></i>
        </div>
        
        <h2 style={styles.receiptTitle}>Payment Successful!</h2>
        
        <div style={styles.receiptDetails}>
          <div style={styles.receiptRow}>
            <span>Plan</span>
            <span>{plan.name}</span>
          </div>
          <div style={styles.receiptRow}>
            <span>Transaction ID</span>
            <span style={{ fontSize: '12px' }}>{transactionId}</span>
          </div>
          <div style={styles.receiptRow}>
            <span>Date</span>
            <span>{date}</span>
          </div>
          <div style={styles.receiptRow}>
            <span>Status</span>
            <span className="badge badge-success">Completed</span>
          </div>
        </div>

        <div style={styles.adminNote}>
          <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i>
          Order sent to admin
        </div>
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1200,
    padding: '20px'
  },
  processingModal: {
    width: '100%',
    maxWidth: '300px',
    padding: '32px',
    textAlign: 'center'
  },
  progressContainer: {
    position: 'relative',
    width: '100px',
    height: '100px',
    margin: '0 auto 24px'
  },
  progressIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '32px'
  },
  processingTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: '8px'
  },
  processingSubtitle: {
    fontSize: '14px',
    color: '#8E8E93',
    marginBottom: '20px'
  },
  progressBar: {
    width: '100%',
    height: '4px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4FFFB0, #2ECC71)',
    borderRadius: '2px'
  },
  receiptModal: {
    width: '100%',
    maxWidth: '320px',
    padding: '32px',
    textAlign: 'center'
  },
  successIcon: {
    marginBottom: '20px'
  },
  receiptTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: '24px'
  },
  receiptDetails: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '20px',
    textAlign: 'left'
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontSize: '14px',
    color: '#FFFFFF'
  },
  adminNote: {
    background: 'rgba(79,255,176,0.1)',
    border: '1px solid #4FFFB0',
    borderRadius: '30px',
    padding: '12px',
    color: '#4FFFB0',
    fontSize: '14px'
  }
};

export default ReceiptModal;