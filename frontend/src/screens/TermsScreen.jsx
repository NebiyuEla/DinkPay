import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BOT_VERSION,
  SUPPORT_PHONE,
  SUPPORT_TELEGRAM,
  TERMS_SECTIONS,
  TERMS_VERSION
} from '../data/legal';

const TermsScreen = ({ requireAcceptance, acceptedAt, isLoading, onAccept, onBack }) => {
  const [agreed, setAgreed] = useState(!requireAcceptance);

  const acceptedLabel = useMemo(() => {
    if (!acceptedAt) return 'Not accepted yet';
    return `Accepted on ${new Date(acceptedAt).toLocaleString()}`;
  }, [acceptedAt]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{ padding: '12px 0 24px', height: '100%', overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '21px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(73,250,132,0.15)',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        ) : null}
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Terms & Conditions</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.54)', fontSize: '13px' }}>
            Last updated {TERMS_VERSION}
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '18px', marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>Dink Pay Bot</h2>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.66)', fontSize: '14px', lineHeight: 1.7 }}>
          Please read these terms carefully before using Dink Pay. Acceptance is required before you continue inside the app.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
        {TERMS_SECTIONS.map((section) => (
          <section key={section.title} style={{ marginBottom: '18px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 700 }}>{section.title}</h3>
            {(section.paragraphs || []).map((paragraph) => (
              <p
                key={paragraph}
                style={{
                  margin: '0 0 10px',
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: '14px',
                  lineHeight: 1.7
                }}
              >
                {paragraph}
              </p>
            ))}
            {(section.bullets || []).length > 0 ? (
              <ul style={{ margin: '0 0 0 18px', padding: 0, color: 'rgba(255,255,255,0.72)' }}>
                {section.bullets.map((bullet) => (
                  <li key={bullet} style={{ marginBottom: '8px', lineHeight: 1.6 }}>
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '18px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'rgba(255,255,255,0.52)' }}>Support phone</span>
            <strong>{SUPPORT_PHONE}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'rgba(255,255,255,0.52)' }}>Telegram</span>
            <strong>{SUPPORT_TELEGRAM}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'rgba(255,255,255,0.52)' }}>Bot version</span>
            <strong>{BOT_VERSION}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'rgba(255,255,255,0.52)' }}>Status</span>
            <strong style={{ color: acceptedAt ? '#49FA84' : '#FACC15' }}>{acceptedLabel}</strong>
          </div>
        </div>
      </div>

      <label
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '18px',
          marginBottom: '16px',
          cursor: requireAcceptance ? 'pointer' : 'default'
        }}
      >
        <input
          type="checkbox"
          checked={agreed}
          disabled={!requireAcceptance}
          onChange={(event) => setAgreed(event.target.checked)}
          style={{ width: '18px', height: '18px', marginTop: '2px' }}
        />
        <span style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, fontSize: '14px' }}>
          I have read, understood, and agree to the Dink Pay Terms and Conditions.
        </span>
      </label>

      {requireAcceptance ? (
        <button
          type="button"
          className="primary-button"
          disabled={!agreed || isLoading}
          onClick={() => onAccept()}
        >
          {isLoading ? 'Saving agreement...' : 'Agree and Continue'}
        </button>
      ) : (
        <button type="button" className="secondary-button" onClick={onBack}>
          Back to Profile
        </button>
      )}
    </motion.div>
  );
};

export default TermsScreen;
