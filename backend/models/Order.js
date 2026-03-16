const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: String,
  user: {
    name: String,
    email: String,
    phone: String
  },
  service: {
    name: String,
    plan: String,
    price: Number
  },
  credentials: {
    type: Map,
    of: String
  },
  paymentMethod: String,
  status: {
    type: String,
    default: 'pending' // pending, paid, delivered
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);