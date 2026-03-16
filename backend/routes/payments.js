import express from 'express';
import axios from 'axios';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Chapa payment
router.post('/initialize', authenticateToken, async (req, res, next) => {
  try {
    const { orderId, amount, email, phone } = req.body;

    // Generate unique transaction reference
    const txRef = `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Call Chapa API
    const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', {
      amount: amount,
      currency: 'ETB',
      email: email,
      phone_number: phone,
      tx_ref: txRef,
      callback_url: `${process.env.BACKEND_URL}/api/payments/verify/${txRef}`,
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      customization: {
        title: 'Dink Pay Payment',
        description: `Payment for order ${orderId}`
      }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Update order with payment reference
    await Order.findByIdAndUpdate(orderId, {
      paymentReference: txRef,
      transactionId: txRef
    });

    res.json({
      checkout_url: response.data.data.checkout_url,
      tx_ref: txRef
    });
  } catch (error) {
    console.error('Chapa error:', error.response?.data || error.message);
    next(error);
  }
});

// Verify payment webhook
router.post('/verify/:txRef', async (req, res) => {
  try {
    const { txRef } = req.params;

    // Verify with Chapa
    const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`
      }
    });

    if (response.data.data.status === 'success') {
      // Update order
      const order = await Order.findOneAndUpdate(
        { paymentReference: txRef },
        { 
          status: 'processing',
          'adminStatus': 'pending'
        },
        { new: true }
      );

      if (order) {
        // Notify admin (you can implement Telegram bot notification here)
        console.log(`Payment successful for order: ${order.orderNumber}`);
        
        // Notify user
        await User.findByIdAndUpdate(order.user, {
          $push: {
            notifications: {
              type: 'payment',
              title: 'Payment Successful',
              message: `Your payment of ${order.amount} ETB has been received`,
              read: false,
              createdAt: new Date()
            }
          }
        });
      }
    }

    res.json({ status: 'verified' });
  } catch (error) {
    console.error('Verification error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;