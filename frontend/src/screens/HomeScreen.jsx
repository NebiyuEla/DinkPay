import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ServiceCard from '../components/ServiceCard';

const HomeScreen = ({
  user,
  services,
  unreadCount,
  activeOrders,
  onServiceSelect,
  onProfileClick,
  onOrdersClick,
  onNotificationsClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        setSearchResults(
          (services || []).filter((service) =>
            service.name.toLowerCase().includes(query)
          )
        );
      } else {
        setSearchResults([]);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [searchQuery, services]);

  const popularServices = (services || []).filter((service) => service.popular);
  const displayServices = searchQuery ? searchResults : popularServices;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '8px 0 104px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', margin: 0 }}>
            <span style={{ color: '#49FA84' }}>DINK</span> PAY
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '6px 0 0' }}>
            Welcome back, {user?.fullName || 'Customer'}
          </p>
        </div>
        <button
          onClick={onProfileClick}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '25px',
            background: 'linear-gradient(135deg, #49FA84, #14E343)',
            border: 'none',
            color: '#002156',
            fontSize: '20px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {(user?.fullName || 'U').charAt(0)}
        </button>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(73,250,132,0.15)',
            borderRadius: '30px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px'
          }}
        >
          <i className="fas fa-search" style={{ color: '#49FA84' }}></i>
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          {searchQuery ? (
            <i
              className="fas fa-times"
              style={{ color: '#49FA84', cursor: 'pointer' }}
              onClick={() => setSearchQuery('')}
            ></i>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0 }}>
          {searchQuery ? 'Search results' : 'Services'}
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {activeOrders > 0 ? (
            <span className="badge badge-pending">{activeOrders} active</span>
          ) : null}
          {unreadCount > 0 ? (
            <span className="badge badge-completed">{unreadCount} alerts</span>
          ) : null}
        </div>
      </div>

      {displayServices.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', alignItems: 'stretch' }}>
          {displayServices.map((service) => (
            <ServiceCard key={service.id} service={service} onClick={() => onServiceSelect(service)} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
          <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
          <p>No services found</p>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: '460px',
          margin: '0 auto',
          height: '74px',
          background: 'rgba(0,33,86,0.95)',
          backdropFilter: 'blur(14px)',
          borderTop: '1px solid rgba(73,250,132,0.15)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 16px',
          zIndex: 100
        }}
      >
        {[
          { label: 'Home', icon: 'fa-home', active: true, onClick: null, count: 0 },
          { label: 'Orders', icon: 'fa-box', onClick: onOrdersClick, count: activeOrders },
          { label: 'Alerts', icon: 'fa-bell', onClick: onNotificationsClick, count: unreadCount },
          { label: 'Profile', icon: 'fa-user', onClick: onProfileClick, count: 0 }
        ].map((item) => (
          <button
            key={item.label}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              color: item.active ? '#49FA84' : '#8E9AAF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            onClick={item.onClick || undefined}
          >
            <i className={`fas ${item.icon}`} style={{ fontSize: '20px' }}></i>
            <span style={{ fontSize: '10px' }}>{item.label}</span>
            {item.count > 0 ? (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '999px',
                  background: '#49FA84',
                  color: '#002156',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 5px'
                }}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default HomeScreen;
