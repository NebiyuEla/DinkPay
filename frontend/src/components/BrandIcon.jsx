import React, { useEffect, useMemo, useState } from 'react';
import { getServiceIconCandidates, warnMissingServiceIcon } from '../utils/serviceIcon';

const BrandIcon = ({ service, alt, imgStyle, fallbackStyle }) => {
  const [attemptIndex, setAttemptIndex] = useState(0);
  const fallback = service?.fallback || service?.name?.charAt(0) || 'D';
  const iconCandidates = useMemo(() => getServiceIconCandidates(service), [service]);

  useEffect(() => {
    setAttemptIndex(0);
  }, [service?.icon, service?.name, service?.id]);

  const activeIcon = iconCandidates[attemptIndex];
  const showFallback = !activeIcon;

  if (showFallback) {
    if (iconCandidates.length > 0) {
      warnMissingServiceIcon(service, iconCandidates);
    }

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
      src={activeIcon}
      alt={alt || service?.name || 'Service'}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
        ...imgStyle
      }}
      onError={() => {
        setAttemptIndex((current) => {
          if (current < iconCandidates.length - 1) {
            return current + 1;
          }

          warnMissingServiceIcon(service, iconCandidates);
          return iconCandidates.length;
        });
      }}
    />
  );
};

export default BrandIcon;
