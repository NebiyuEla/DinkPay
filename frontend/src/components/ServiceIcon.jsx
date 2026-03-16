import React, { useState } from 'react';

const ServiceIcon = ({ service, size = 56, style = {} }) => {
  const [imageError, setImageError] = useState(false);

  // If image fails to load, show fallback
  if (imageError || !service.icon) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: size / 3.5,
        background: service.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.43,
        fontWeight: 600,
        color: 'white',
        ...style
      }}>
        {service.fallback || service.name.charAt(0)}
      </div>
    );
  }

  // Try to load SVG
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: size / 3.5,
      background: service.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      ...style
    }}>
      <img 
        src={service.icon}
        alt={service.name}
        style={{
          width: size * 0.6,
          height: size * 0.6,
          objectFit: 'contain',
          filter: 'brightness(0) invert(1)' // Makes white SVG
        }}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default ServiceIcon;