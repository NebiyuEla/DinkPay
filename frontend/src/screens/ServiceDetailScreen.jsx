import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import BrandIcon from '../components/BrandIcon';
import { buildServiceTheme } from '../utils/serviceSurface';
import { formatEtb } from '../utils/format';

const ServiceDetailScreen = ({ service, onBack, onSelectPlan }) => {
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const serviceTheme = useMemo(() => buildServiceTheme(service.color), [service.color]);

  const selectedPlan = useMemo(
    () => service?.plans?.[selectedPlanIndex] || null,
    [service?.plans, selectedPlanIndex]
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '8px 0 20px'
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
          background: serviceTheme.surface,
          border: `1px solid ${serviceTheme.border}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '78px',
              height: '78px',
              borderRadius: '24px',
              background: serviceTheme.iconShell,
              border: `1px solid ${serviceTheme.iconShellBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px',
              flexShrink: 0
            }}
          >
            <BrandIcon
              service={service}
              imgStyle={{
                filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.28))'
              }}
              fallbackStyle={{
                fontSize: '30px'
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: serviceTheme.mutedText, marginBottom: '8px' }}>
              DINK Payment
            </div>
            <h1 style={{ fontSize: '28px', lineHeight: 1.02, fontWeight: 800, color: serviceTheme.primaryText, margin: 0 }}>
              {service.name}
            </h1>
            <p style={{ margin: '8px 0 0', color: serviceTheme.secondaryText, fontSize: '13px', lineHeight: 1.5 }}>
              Choose your plan and keep moving. The next step takes you straight to the account details and payment.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Choose a plan</h2>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
              {service.plans.length} option{service.plans.length === 1 ? '' : 's'} available
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: service.plans.length === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))',
            gap: '10px'
          }}
        >
          {service.plans.map((plan, index) => {
            const isSelected = selectedPlanIndex === index;

            return (
              <motion.button
                type="button"
                key={`${plan.name}-${plan.price}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlanIndex(index)}
                style={{
                  borderRadius: '18px',
                  border: isSelected ? '1px solid rgba(73,250,132,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  background: isSelected ? 'rgba(73,250,132,0.12)' : 'rgba(255,255,255,0.04)',
                  color: 'white',
                  textAlign: 'left',
                  padding: '14px',
                  cursor: 'pointer',
                  minHeight: '100px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.2 }}>{plan.name}</div>
                    {plan.quality ? (
                      <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        {plan.quality}
                      </div>
                    ) : null}
                  </div>
                  {isSelected ? (
                    <span style={{ color: '#49FA84' }}>
                      <i className="fas fa-circle-check"></i>
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#49FA84' }}>Pay {formatEtb(plan.price)}</div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {selectedPlan ? (
        <div style={{ marginTop: '12px' }}>
          <button
            className="primary-button"
            onClick={() => onSelectPlan(selectedPlan)}
          >
            Continue to Checkout
          </button>
        </div>
      ) : null}
    </motion.div>
  );
};

export default ServiceDetailScreen;
