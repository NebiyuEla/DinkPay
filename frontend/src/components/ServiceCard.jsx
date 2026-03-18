import React from 'react';
import { motion } from 'framer-motion';
import BrandIcon from './BrandIcon';
import { buildServiceTheme } from '../utils/serviceSurface';

const ServiceCard = ({ service, onClick }) => {
  const theme = buildServiceTheme(service.color);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      className="glass-card"
      style={{
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        position: 'relative',
        background: theme.surface,
        borderRadius: '18px',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        minHeight: '172px',
        overflow: 'hidden'
      }}
      onClick={onClick}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: theme.overlay,
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '172px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '22px 16px 10px'
          }}
        >
          <BrandIcon
            service={service}
            imgStyle={{
              maxWidth: '92px',
              maxHeight: '70px',
              filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.18))'
            }}
            fallbackStyle={{
              fontSize: '40px'
            }}
          />
        </div>

        <div
            style={{
              width: '100%',
              padding: '0 10px 14px'
          }}
        >
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: theme.primaryText,
              margin: 0,
              lineHeight: 1.15,
              textAlign: 'center',
              textWrap: 'balance',
              textShadow: theme.isLight ? 'none' : '0 4px 14px rgba(0,0,0,0.22)'
            }}
          >
            {service.name}
          </h3>
        </div>
      </div>
    </motion.button>
  );
};

export default ServiceCard;
