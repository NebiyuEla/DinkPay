import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    // Prevent scrolling on splash screen
    document.body.style.overflow = 'hidden';
    
    const timer = setTimeout(() => {
      document.body.style.overflow = 'auto';
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'auto';
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#002156',
        zIndex: 9999
      }}
    >
      <h1 style={{ fontSize: '42px', fontWeight: 700 }}>
        <span style={{ color: '#49FA84' }}>DINK</span>{' '}
        <span style={{ color: '#F2F3F5' }}>PAY</span>
      </h1>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
        Premium Digital Payments
      </p>
    </motion.div>
  );
};

export default SplashScreen;