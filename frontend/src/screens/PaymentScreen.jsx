import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '../config';
import BrandIcon from '../components/BrandIcon';
import { buildServiceSurface } from '../utils/serviceSurface';
import { formatEtb } from '../utils/format';

const normalizeMessage = (value, fallback) => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (value && typeof value === 'object') {
    if (typeof value.message === 'string' && value.message.trim()) {
      return value.message;
    }

    const parts = Object.values(value).filter((entry) => typeof entry === 'string' && entry.trim());
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  return fallback;
};

const PaymentScreen = ({ service, plan, pendingCredentials, onBack }) => {
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const credentialCount = Object.keys(pendingCredentials || {}).length;
  const detailRows = useMemo(
    () => [
      { label: 'Service', value: service.name },
      { label: 'Plan', value: plan.name },
      { label: 'Credentials', value: credentialCount > 0 ? `${credentialCount} field${credentialCount === 1 ? '' : 's'}` : 'No extra fields' },
      { label: 'Payment', value: 'ETB secure checkout' }
    ],
    [credentialCount, plan.name, service.name]
  );

  const handleChapaPayment = async () => {
    setProcessing(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('dinkToken')}`
        },
        body: JSON.stringify({
          service: {
            id: service.id,
            name: service.name,
            icon: service.icon,
            fallback: service.fallback,
            color: service.color
          },
          plan: {
            name: plan.name,
            price: plan.price
          },
          credentials: pendingCredentials || {},
          returnMode: 'web'
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.checkoutUrl) {
        throw new Error(normalizeMessage(data.message, 'Unable to create checkout right now.'));
      }

      window.location.assign(data.checkoutUrl);
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(normalizeMessage(error.message, 'Unable to start payment. Please try again.'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        padding: '8px 0 20px',
        height: '100%',
        overflowY: 'auto'
      }}
    >
      <button
        onClick={onBack}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '22px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(73,250,132,0.15)',
          color: 'rgba(255,255,255,0.78)',
          fontSize: '16px',
          marginBottom: '12px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <i className="fas fa-arrow-left"></i>
      </button>

      <div
        className="glass-card"
        style={{
          padding: '18px',
          marginBottom: '12px',
          background: buildServiceSurface(service.color)
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '22px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              flexShrink: 0
            }}
          >
            <BrandIcon
              service={service}
              imgStyle={{
                filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.28))'
              }}
              fallbackStyle={{
                fontSize: '28px'
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', marginBottom: '8px' }}>
              Order payment
            </div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>{service.name}</h2>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: '13px' }}>
              {plan.name} plan
            </p>
            <div style={{ marginTop: '10px', color: '#49FA84', fontSize: '16px', fontWeight: 800 }}>
              Pay {formatEtb(plan.price)}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px', marginBottom: '12px' }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          {detailRows.map((row, index) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '16px',
                paddingBottom: index === detailRows.length - 1 ? 0 : '12px',
                borderBottom: index === detailRows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.56)' }}>{row.label}</span>
              <strong style={{ textAlign: 'right' }}>{row.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <button
        className="primary-button"
        onClick={handleChapaPayment}
        disabled={processing}
        style={{ marginBottom: errorMessage ? '14px' : 0 }}
      >
        {processing ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <i className="fas fa-spinner fa-spin"></i>
            Opening secure checkout...
          </span>
        ) : (
          `Pay ${formatEtb(plan.price)}`
        )}
      </button>

      {errorMessage ? (
        <div
          style={{
            borderRadius: '16px',
            padding: '14px 16px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.32)',
            color: '#ffb4b4',
            fontSize: '13px'
          }}
        >
          <i className="fas fa-circle-exclamation" style={{ marginRight: '8px' }}></i>
          {errorMessage}
        </div>
      ) : null}
    </motion.div>
  );
};

export default PaymentScreen;
