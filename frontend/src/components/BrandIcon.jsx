import React, { useEffect, useState } from 'react';

const BrandIcon = ({ service, alt, imgStyle, fallbackStyle }) => {
  const [failed, setFailed] = useState(false);
  const fallback = service?.fallback || service?.name?.charAt(0) || 'D';

  useEffect(() => {
    setFailed(false);
  }, [service?.icon, service?.name]);

  if (failed || !service?.icon) {
    return (
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          fontWeight: 800,
          color: '#ffffff',
          textShadow: '0 8px 24px rgba(0, 0, 0, 0.26)',
          ...fallbackStyle
        }}
      >
        {fallback}
      </span>
    );
  }

  return (
    <img
      src={service.icon}
      alt={alt || service?.name || 'Service'}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
        ...imgStyle
      }}
      onError={() => setFailed(true)}
    />
  );
};

export default BrandIcon;
