import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ProcessingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px'
      }}
    >
      {/* Animated Progress Circle */}
      <div 
        className="progress-circle"
        style={{
          background: `conic-gradient(#49FA84 ${progress * 3.6}deg, rgba(255,255,255,0.1) ${progress * 3.6}deg)`
        }}
      >
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '42px',
          background: '#002156',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          <i className="fas fa-lock" style={{ fontSize: '32px', color: '#49FA84' }}></i>
        </div>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>
          Payment Processing
        </h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          Secured payment authentication
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div 
          style={{ 
            width: `${progress}%`, 
            height: '100%', 
            background: 'linear-gradient(90deg, #49FA84, #14E343)',
            borderRadius: '2px',
            transition: 'width 0.1s linear'
          }}
        />
      </div>
    </motion.div>
  );
};

export default ProcessingScreen;