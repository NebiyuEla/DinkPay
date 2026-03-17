import React, { useState } from 'react';
import { motion } from 'framer-motion';
import BrandIcon from '../components/BrandIcon';
import { buildServiceSurface } from '../utils/serviceSurface';
import { formatEtb } from '../utils/format';

const CredentialScreen = ({ service, plan, onBack, onSubmit }) => {
  const [credentials, setCredentials] = useState({});
  const [showPassword, setShowPassword] = useState({});

  const handleInputChange = (field, value) => {
    setCredentials((current) => ({ ...current, [field]: value }));
  };

  const togglePassword = (field) => {
    setShowPassword((current) => ({ ...current, [field]: !current[field] }));
  };

  const inputs = service.inputs || [];
  const isFormValid = () => inputs.every((input) => credentials[input.label]?.trim());

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isFormValid()) {
      onSubmit(credentials);
    }
  };

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
          background: buildServiceSurface(service.color)
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <BrandIcon
              service={service}
              imgStyle={{
                filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.28))'
              }}
              fallbackStyle={{
                fontSize: '26px'
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>{service.name}</h2>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.74)', fontSize: '13px' }}>
              {plan.name} plan
            </p>
            <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 700, color: '#49FA84' }}>
              Pay {formatEtb(plan.price)}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {inputs.length > 0 ? (
          <div className="glass-card" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Account details</h3>
              <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                Enter the service credentials the admin should work with.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              {inputs.map((input) => {
                const isPassword = input.type === 'password';

                return (
                  <div key={input.label}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.58)',
                        marginBottom: '8px'
                      }}
                    >
                      {input.label}
                    </label>

                    <div className="input-wrapper">
                      <input
                        type={isPassword && !showPassword[input.label] ? 'password' : 'text'}
                        placeholder={input.placeholder}
                        className="input-field"
                        style={{
                          paddingRight: isPassword ? '48px' : '16px'
                        }}
                        value={credentials[input.label] || ''}
                        onChange={(event) => handleInputChange(input.label, event.target.value)}
                        required
                      />

                      {isPassword ? (
                        <i
                          className={`fas ${showPassword[input.label] ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                          onClick={() => togglePassword(input.label)}
                        ></i>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '16px', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>No extra details needed</h3>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.54)', fontSize: '13px', lineHeight: 1.6 }}>
              This service can move straight to payment without entering credentials.
            </p>
          </div>
        )}

        <div className="glass-card" style={{ padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Service</span>
            <strong>{service.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Plan</span>
            <strong>{plan.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Amount</span>
            <strong style={{ color: '#49FA84' }}>{formatEtb(plan.price)}</strong>
          </div>
        </div>

        <button
          type="submit"
          className="primary-button"
          disabled={!isFormValid()}
        >
          Continue to Pay {formatEtb(plan.price)}
        </button>
      </form>
    </motion.div>
  );
};

export default CredentialScreen;
