import React from 'react';
import { motion } from 'framer-motion';

const getFormattedBodyStyle = (formatStyle) => {
  if (formatStyle === 'bold') {
    return { fontWeight: 700 };
  }

  if (formatStyle === 'italic') {
    return { fontStyle: 'italic' };
  }

  if (formatStyle === 'code') {
    return {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '14px',
      padding: '10px 12px',
      whiteSpace: 'pre-wrap'
    };
  }

  return {};
};

const NotificationsScreen = ({ notifications, onBack, markAsRead, markAllAsRead }) => {
  const displayNotifications = notifications || [];
  const unreadCount = displayNotifications.filter((notification) => !notification.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{ padding: '12px 0 20px', height: '100%', overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        <button
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
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Notifications</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
            Payment updates, admin messages, and order progress
          </p>
        </div>
      </div>

      {unreadCount > 0 ? (
        <button
          type="button"
          className="secondary-button"
          onClick={markAllAsRead}
          style={{ marginBottom: '14px', height: '46px' }}
        >
          Mark all as read
        </button>
      ) : null}

      {displayNotifications.length > 0 ? (
        <div style={{ display: 'grid', gap: '10px' }}>
          {displayNotifications.map((notification, index) => {
            const attachment = notification.attachment;
            const bodyStyle = getFormattedBodyStyle(notification.formatStyle);

            return (
              <motion.button
                type="button"
                key={notification._id || index}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`notification-card ${!notification.read ? 'unread' : ''}`}
                style={{
                  width: '100%',
                  border: 'none',
                  textAlign: 'left',
                  background: !notification.read ? 'rgba(73,250,132,0.08)' : 'rgba(255,255,255,0.04)',
                  borderRadius: '20px',
                  padding: '16px'
                }}
                onClick={() => !notification.read && markAsRead(notification._id)}
              >
                <div
                  className="notification-icon"
                  style={{
                    background:
                      notification.type === 'success'
                        ? 'rgba(73,250,132,0.15)'
                        : notification.type === 'error'
                          ? 'rgba(239,68,68,0.16)'
                          : 'rgba(250,204,21,0.15)',
                    color:
                      notification.type === 'success'
                        ? '#49FA84'
                        : notification.type === 'error'
                          ? '#EF4444'
                          : '#FACC15'
                  }}
                >
                  <i
                    className={`fas ${
                      notification.type === 'success'
                        ? 'fa-check-circle'
                        : notification.type === 'error'
                          ? 'fa-circle-exclamation'
                          : 'fa-bell'
                    }`}
                  ></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{notification.title}</h4>
                    {!notification.read ? (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#49FA84',
                          flexShrink: 0,
                          marginTop: '6px'
                        }}
                      ></span>
                    ) : null}
                  </div>

                  <div style={{ marginBottom: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', ...bodyStyle }}>
                    {notification.message}
                  </div>

                  {attachment?.url ? (
                    <div style={{ marginBottom: '10px' }}>
                      {attachment.kind === 'photo' ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name || 'attachment'}
                          style={{ width: '100%', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                      ) : null}

                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          borderRadius: '999px',
                          textDecoration: 'none',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'white'
                        }}
                      >
                        <i
                          className={`fas ${
                            attachment.kind === 'audio'
                              ? 'fa-headphones'
                              : attachment.kind === 'photo'
                                ? 'fa-image'
                                : 'fa-paperclip'
                          }`}
                        ></i>
                        {attachment.kind === 'photo' ? 'Open photo' : attachment.kind === 'audio' ? 'Open audio' : 'Open file'}
                      </a>
                    </div>
                  ) : null}

                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.36)' }}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
          <i className="fas fa-bell-slash" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
          <p>No notifications yet</p>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationsScreen;
