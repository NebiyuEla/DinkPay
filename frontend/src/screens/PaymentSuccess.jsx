import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tx_ref = searchParams.get('tx_ref');

  useEffect(() => {
    // Verify payment with backend
    const verifyPayment = async () => {
      if (tx_ref) {
        try {
          await fetch(`/api/chapa/verify/${tx_ref}`);
        } catch (error) {
          console.error('Verification error:', error);
        }
      }
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    };

    verifyPayment();
  }, [tx_ref, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: '#002156'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '40px',
        background: 'rgba(73, 250, 132, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        border: '2px solid #49FA84'
      }}>
        <i className="fas fa-check-circle" style={{ fontSize: '40px', color: '#49FA84' }}></i>
      </div>
      
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', color: '#49FA84' }}>
        Payment Successful!
      </h2>
      
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
        Your payment has been processed successfully.
        <br />
        Redirecting to home...
      </p>
    </div>
  );
};

export default PaymentSuccess;