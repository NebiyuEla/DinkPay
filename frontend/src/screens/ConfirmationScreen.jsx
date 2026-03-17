import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BrandIcon from '../components/BrandIcon';
import { formatEtb } from '../utils/format';

const ConfirmationScreen = ({ order, onHome }) => {
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          onHome();
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [onHome]);

  const service = order?.service || {};
  const plan = order?.plan || {};

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px 0'
      }}
    >
      <div
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(73,250,132,0.16)',
          border: '2px solid #49FA84',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          animation: 'pulse 2s infinite'
        }}
      >
        <i className="fas fa-check-circle" style={{ fontSize: '48px', color: '#49FA84' }}></i>
      </div>

      <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', textAlign: 'center', color: '#49FA84' }}>
        Payment confirmed
      </h2>
      <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.62)', marginBottom: '28px', textAlign: 'center', maxWidth: '300px' }}>
        Your order has been sent to the admin with your submitted credentials. We will notify you as it moves into processing.
      </p>

      <div className="glass-card" style={{ width: '100%', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: service.color || '#49FA84',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '8px'
            }}
          >
            <BrandIcon
              service={service}
              imgStyle={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' }}
              fallbackStyle={{ fontSize: '18px' }}
            />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{service.name || 'Service'}</h3>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.52)', fontSize: '13px' }}>
              {plan.name || 'Selected plan'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ color: 'rgba(255,255,255,0.54)' }}>Order ID</span>
            <strong>{order?.orderId || 'N/A'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ color: 'rgba(255,255,255,0.54)' }}>Transaction Ref</span>
            <strong style={{ fontSize: '12px' }}>{order?.transactionId || 'N/A'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ color: 'rgba(255,255,255,0.54)' }}>Amount</span>
            <strong style={{ color: '#49FA84' }}>{formatEtb(order?.totalAmount || plan.price || 0)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ color: 'rgba(255,255,255,0.54)' }}>Payment</span>
            <span className="badge badge-completed">{order?.paymentStatus || 'paid'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.54)' }}>Fulfilment</span>
            <span className="badge badge-pending">{order?.status || 'pending'}</span>
          </div>
        </div>

        <div
          style={{
            marginTop: '18px',
            padding: '14px 16px',
            borderRadius: '16px',
            background: 'rgba(73,250,132,0.08)',
            color: '#7dffb4',
            fontSize: '13px',
            lineHeight: 1.6
          }}
        >
          <i className="fas fa-bell" style={{ marginRight: '8px' }}></i>
          You will get a notification when the admin starts processing and when the order is complete.
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', marginBottom: '8px' }}>
          Returning to home in {countdown} seconds...
        </p>
        <button className="secondary-button" onClick={onHome}>
          Go to Home Now
        </button>
      </div>
    </motion.div>
  );
};

export default ConfirmationScreen;
