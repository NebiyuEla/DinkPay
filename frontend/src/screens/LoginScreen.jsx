import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatPhoneInput, isValidPhoneNumber } from '../utils/phone';

const LoginScreen = ({ onLogin, onSignup, onTelegramLogin, isLoading }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isLogin && !isValidPhoneNumber(formData.phone)) {
      alert('Please enter a valid phone number like +2519XXXXXXXX');
      return;
    }

    if (isLogin) {
      onLogin({
        email: formData.email,
        password: formData.password
      });
    } else {
      onSignup(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '20px',
        background: '#002156',
        position: 'relative',
        zIndex: 1
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 700, marginBottom: '8px' }}>
          <span style={{ color: '#49FA84' }}>DINK</span>{' '}
          <span style={{ color: '#F2F3F5' }}>PAY</span>
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          Premium Digital Payments
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="tab-bar" style={{ marginBottom: '32px' }}>
        <button
          className={`tab ${isLogin ? 'active' : ''}`}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button
          className={`tab ${!isLogin ? 'active' : ''}`}
          onClick={() => setIsLogin(false)}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="input-wrapper" style={{ marginBottom: '16px' }}>
            <i className="fas fa-user input-icon"></i>
            <input
              type="text"
              placeholder="Full Name"
              className="input-field with-icon"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              required={!isLogin}
            />
          </div>
        )}

        <div className="input-wrapper" style={{ marginBottom: '16px' }}>
          <i className="fas fa-envelope input-icon"></i>
          <input
            type="email"
            placeholder="Gmail"
            className="input-field with-icon"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        {!isLogin && (
          <div className="input-wrapper" style={{ marginBottom: '16px' }}>
            <i className="fas fa-phone input-icon"></i>
            <input
              type="tel"
              placeholder="Phone Number"
              className="input-field with-icon"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              onBlur={(e) => setFormData({...formData, phone: formatPhoneInput(e.target.value)})}
              required={!isLogin}
            />
          </div>
        )}

        <div className="input-wrapper" style={{ marginBottom: '24px' }}>
          <i className="fas fa-lock input-icon"></i>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            className="input-field with-icon"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <i 
            className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
            onClick={() => setShowPassword(!showPassword)}
          ></i>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="secondary-button"
          style={{ marginBottom: '16px' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <i className="fas fa-spinner fa-spin"></i>
              Processing...
            </span>
          ) : (
            isLogin ? 'Login with Gmail' : 'Sign Up with Gmail'
          )}
        </button>

        {/* OR Divider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          marginBottom: '16px',
          color: 'rgba(255,255,255,0.3)'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ fontSize: '12px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        {/* Telegram Button */}
        <button 
          type="button" 
          className="primary-button" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px',
            background: 'linear-gradient(135deg, #49FA84, #14E343)'
          }}
          onClick={onTelegramLogin}
          disabled={isLoading}
        >
          <i className="fab fa-telegram" style={{ fontSize: '18px' }}></i>
          {isLoading ? 'Connecting...' : 'Continue with Telegram'}
        </button>
      </form>

      {/* Security Text */}
      <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
        <i className="fas fa-shield-alt" style={{ marginRight: '4px', color: '#49FA84' }}></i>
        Secured by DINK Pay
      </p>
    </motion.div>
  );
};

export default LoginScreen;
