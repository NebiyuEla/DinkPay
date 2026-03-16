import React, { useState } from 'react';
import { motion } from 'framer-motion';

const LoginScreen = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      name: activeTab === 'login' ? formData.email.split('@')[0] : formData.fullName,
      email: formData.email
    });
  };

  return (
    <div style={styles.container}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={styles.card}
        className="glass-card"
      >
        {/* Logo */}
        <div style={styles.logoContainer}>
          <i className="fas fa-droplet" style={styles.logoIcon}></i>
          <span style={styles.logoText}>Dink Pay</span>
        </div>

        {/* Tabs */}
        <div style={styles.tabContainer} className="tab-container">
          <button
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {activeTab === 'signup' && (
            <div style={styles.inputWrapper}>
              <i className="fas fa-user" style={styles.inputIcon}></i>
              <input
                type="text"
                placeholder="Full Name"
                className="glass-input"
                style={styles.input}
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
            </div>
          )}

          <div style={styles.inputWrapper}>
            <i className="fas fa-envelope" style={styles.inputIcon}></i>
            <input
              type="email"
              placeholder="Gmail"
              className="glass-input"
              style={styles.input}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div style={styles.inputWrapper}>
            <i className="fas fa-lock" style={styles.inputIcon}></i>
            <input
              type="password"
              placeholder="Password"
              className="glass-input"
              style={styles.input}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          {/* Google Button */}
          <button type="button" style={styles.googleButton} className="outline-button">
            <i className="fab fa-google" style={{ marginRight: '8px' }}></i>
            Google Auto Sign-in
          </button>

          {/* Action Buttons */}
          <div style={styles.buttonRow}>
            <button type="submit" className="premium-button" style={styles.submitButton}>
              {activeTab === 'login' ? 'Login' : 'Sign Up'}
            </button>
            {activeTab === 'login' && (
              <button type="button" className="outline-button" style={styles.loginButton}>
                Login
              </button>
            )}
          </div>
        </form>

        {/* Security Text */}
        <p style={styles.securityText}>
          <i className="fas fa-shield-alt" style={{ marginRight: '4px' }}></i>
          Security designed
        </p>
      </motion.div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    background: '#0A0F1E'
  },
  card: {
    width: '100%',
    maxWidth: '343px',
    padding: '24px'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '32px'
  },
  logoIcon: {
    fontSize: '32px',
    color: '#4FFFB0'
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  tabContainer: {
    marginBottom: '24px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  inputWrapper: {
    position: 'relative',
    width: '100%'
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#8E8E93',
    fontSize: '16px',
    zIndex: 1
  },
  input: {
    paddingLeft: '44px'
  },
  googleButton: {
    marginTop: '8px',
    marginBottom: '8px'
  },
  buttonRow: {
    display: 'flex',
    gap: '8px'
  },
  submitButton: {
    flex: 1
  },
  loginButton: {
    flex: 1
  },
  securityText: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#8E8E93',
    marginTop: '20px'
  }
};

export default LoginScreen;