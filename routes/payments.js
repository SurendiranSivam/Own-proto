const express = require('express');
const router = express.Router();
const paymentModel = require('../models/payment');
const { validatePayment, validationMiddleware } = require('../utils/validators');

// Apply validation middleware
const validatePaymentInput = validationMiddleware(validatePayment);

router.get('/', async (req, res) => {
  try {
    const payments = await paymentModel.getAll();
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.get('/pending/receivables', async (req, res) => {
  try {
    const pending = await paymentModel.getPendingReceivables();
    res.json({ total_pending: pending });
  } catch (error) {
    console.error('Error fetching pending receivables:', error);
    res.status(500).json({ error: 'Failed to fetch pending receivables' });
  }
});

router.get('/order/:orderId', async (req, res) => {
  try {
    const payments = await paymentModel.getByOrderId(req.params.orderId);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments for order:', error);
    res.status(500).json({ error: 'Failed to fetch payments for order' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const payment = await paymentModel.getById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

router.post('/', validatePaymentInput, async (req, res) => {
  try {
    const {
      order_id, amount, payment_type, payment_method,
      payment_date, transaction_ref, notes
    } = req.body;

    const payment = await paymentModel.create({
      order_id: parseInt(order_id),
      amount: parseFloat(amount),
      payment_type,
      payment_method: payment_method || 'cash',
      payment_date,
      transaction_ref: transaction_ref || null,
      notes: notes || null
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await paymentModel.remove(req.params.id);
    res.json({ success: true, message: 'Payment deleted and order status updated' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    if (error.message === 'Payment not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to delete payment' });
    }
  }
});

module.exports = router;
