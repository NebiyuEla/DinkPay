import React from 'react';
import { motion } from 'framer-motion';
import BrandIcon from './BrandIcon';
import { buildServiceSurface } from '../utils/serviceSurface';

const ServiceCard = ({ service, onClick }) => {
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
        background: buildServiceSurface(service.color),
        borderRadius: '18px',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 18px 34px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.1)',
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
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 26%, rgba(7,11,24,0.12) 100%)',
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
              color: '#FFFFFF',
              margin: 0,
              lineHeight: 1.15,
              textAlign: 'center',
              textWrap: 'balance',
              textShadow: '0 4px 14px rgba(0,0,0,0.22)'
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
