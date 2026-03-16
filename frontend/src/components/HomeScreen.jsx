import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPopularServices, getAllServices } from '../data/services';

const HomeScreen = ({ user, onServiceSelect, onProfileClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const popularServices = getPopularServices();
  const allServices = getAllServices();

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        const results = allServices.filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, allServices]);

  const displayServices = searchQuery ? searchResults : popularServices;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dink Pay</h1>
          <p style={styles.welcome}>Welcome, {user?.name || 'User'}</p>
        </div>
        <button style={styles.profileButton} onClick={onProfileClick}>
          {user?.name?.charAt(0) || 'U'}
        </button>
      </div>

      {/* Search Bar */}
      <div style={styles.searchContainer} className="glass-card">
        <i className="fas fa-search" style={styles.searchIcon}></i>
        <input
          type="text"
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        {searchQuery && (
          <i 
            className="fas fa-times" 
            style={styles.clearIcon}
            onClick={() => setSearchQuery('')}
          ></i>
        )}
      </div>

      {/* Services Grid */}
      <div style={styles.grid}>
        {displayServices.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card"
            style={styles.serviceCard}
            onClick={() => onServiceSelect(service)}
          >
            <div style={{
              ...styles.serviceIcon,
              backgroundColor: service.color
            }}>
              <span style={styles.serviceIconText}>{service.icon}</span>
            </div>
            <span style={styles.serviceName}>{service.name}</span>
          </motion.div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div style={styles.bottomNav}>
        <button style={{...styles.navItem, color: '#4FFFB0'}}>
          <i className="fas fa-home"></i>
          <span style={styles.navLabel}>Home</span>
        </button>
        <button style={styles.navItem}>
          <i className="fas fa-shopping-bag"></i>
          <span style={styles.navLabel}>Orders</span>
        </button>
        <button style={styles.navItem}>
          <i className="fas fa-bell"></i>
          <span style={styles.navLabel}>Alerts</span>
        </button>
        <button style={styles.navItem} onClick={onProfileClick}>
          <i className="fas fa-user"></i>
          <span style={styles.navLabel}>Profile</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    maxWidth: '375px',
    margin: '0 auto',
    minHeight: '100vh',
    padding: '16px',
    paddingBottom: '80px',
    background: '#0A0F1E'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  welcome: {
    fontSize: '13px',
    color: '#8E8E93',
    marginTop: '2px'
  },
  profileButton: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #4FFFB0, #2ECC71)',
    border: 'none',
    color: '#0A0F1E',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    height: '48px',
    marginBottom: '24px'
  },
  searchIcon: {
    color: '#8E8E93',
    marginRight: '12px',
    fontSize: '14px'
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none'
  },
  clearIcon: {
    color: '#8E8E93',
    cursor: 'pointer',
    fontSize: '14px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  serviceCard: {
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer'
  },
  serviceIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  serviceIconText: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  serviceName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#FFFFFF'
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: '375px',
    margin: '0 auto',
    background: 'rgba(10,15,30,0.95)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(79,255,176,0.1)',
    height: '60px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  navItem: {
    background: 'none',
    border: 'none',
    color: '#8E8E93',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    fontSize: '20px'
  },
  navLabel: {
    fontSize: '10px'
  }
};

export default HomeScreen;