import React, { useState } from 'react';
import { motion } from 'framer-motion';

const filters = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' }
];

const getPaymentBadgeClass = (status) => {
  if (status === 'paid') return 'badge-completed';
  if (status === 'failed') return 'badge-failed';
  return 'badge-pending';
};

const getPaymentLabel = (status) => {
  if (status === 'paid') return 'paid';
  if (status === 'failed') return 'failed';
  if (status === 'refunded') return 'refunded';
  return 'payment check';
};

const getOrderStatusLabel = (order) => {
  if (order.status === 'cancelled') return 'cancelled';
  if (order.status === 'completed') return 'completed';
  if (order.status === 'processing') return 'processing';
  if (order.paymentStatus !== 'paid') return 'payment check';
  return 'pending';
};

const OrdersScreen = ({ orders, onBack }) => {
  const [activeTab, setActiveTab] = useState('active');

  const displayOrders = (orders || []).filter((order) => {
    if (activeTab === 'active') {
      return order.paymentStatus === 'paid' && !['completed', 'cancelled'].includes(order.status);
    }
    if (activeTab === 'completed') return order.status === 'completed';
    return true;
  });

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
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>My Orders</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
            Track payment and admin processing in one place
          </p>
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: '20px' }}>
        {filters.map((filter) => (
          <button
            key={filter.key}
            className={`tab ${activeTab === filter.key ? 'active' : ''}`}
            onClick={() => setActiveTab(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {displayOrders.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {displayOrders.map((order, index) => (
            <motion.div
              key={order._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="glass-card"
              style={{ padding: '18px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>{order.service?.name || 'Service'}</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '6px 0 0' }}>
                    {order.plan?.name || 'Plan'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={`badge ${getPaymentBadgeClass(order.paymentStatus)}`}>
                    {getPaymentLabel(order.paymentStatus)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '10px',
                  marginBottom: '14px'
                }}
              >
                <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>Amount</div>
                  <strong style={{ color: '#49FA84' }}>{order.totalAmount || order.amount} ETB</strong>
                </div>
                <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>Admin Status</div>
                  <strong style={{ textTransform: 'capitalize' }}>{getOrderStatusLabel(order)}</strong>
                </div>
              </div>

              {order.adminNote ? (
                <div
                  style={{
                    marginBottom: '14px',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: 'rgba(255,255,255,0.78)',
                    fontSize: '12px',
                    lineHeight: 1.55
                  }}
                >
                  <strong style={{ color: '#ffb4b4' }}>Admin note:</strong> {order.adminNote}
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.42)' }}>
                <span>ID: {order.orderId || (order._id || '').slice(-8)}</span>
                <span>{new Date(order.createdAt || order.date).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
          <i className="fas fa-box-open" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
          <p>No orders in this view yet</p>
        </div>
      )}
    </motion.div>
  );
};

export default OrdersScreen;
