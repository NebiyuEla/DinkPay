import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ServiceModal = ({ service, onClose, onSelectPlan }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);

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
        transition={{ type: 'tween', duration: 0.3 }}
        className="glass-card"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={{...styles.serviceIcon, backgroundColor: service.color}}>
            <span style={styles.serviceIconText}>{service.icon}</span>
          </div>
          <h2 style={styles.serviceName}>{service.name}</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Plans */}
        <h3 style={styles.sectionTitle}>Choose Plan</h3>
        <div style={styles.plansContainer}>
          {service.plans.map((plan, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="glass-card"
              style={{
                ...styles.planCard,
                ...(selectedPlan === index && styles.selectedPlan)
              }}
              onClick={() => setSelectedPlan(index)}
            >
              <span style={styles.planName}>{plan.name}</span>
              <span style={styles.planPrice}>{plan.price} ETB</span>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        {selectedPlan !== null && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-button"
            style={styles.continueButton}
            onClick={() => onSelectPlan(service.plans[selectedPlan])}
          >
            Continue
          </motion.button>
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
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000
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
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  serviceIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  serviceIconText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  serviceName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1
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
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: '12px'
  },
  plansContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px'
  },
  planCard: {
    padding: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    border: '1px solid transparent'
  },
  selectedPlan: {
    border: '1px solid #4FFFB0'
  },
  planName: {
    fontSize: '15px',
    color: '#FFFFFF'
  },
  planPrice: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#4FFFB0'
  },
  continueButton: {
    marginTop: '8px'
  }
};

export default ServiceModal;