const express = require('express');
const router = express.Router();
const printUsageModel = require('../models/printUsage');
const { validatePrintUsage, validationMiddleware } = require('../utils/validators');

// Apply validation middleware
const validatePrintUsageInput = validationMiddleware(validatePrintUsage);

router.get('/', async (req, res) => {
  try {
    const usage = await printUsageModel.getAll();
    res.json(usage);
  } catch (error) {
    console.error('Error fetching print usage:', error);
    res.status(500).json({ error: 'Failed to fetch print usage' });
  }
});

router.get('/order/:orderId', async (req, res) => {
  try {
    const usage = await printUsageModel.getByOrderId(req.params.orderId);
    res.json(usage);
  } catch (error) {
    console.error('Error fetching print usage for order:', error);
    res.status(500).json({ error: 'Failed to fetch print usage for order' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const usage = await printUsageModel.getById(req.params.id);
    if (!usage) {
      return res.status(404).json({ error: 'Print usage entry not found' });
    }
    res.json(usage);
  } catch (error) {
    console.error('Error fetching print usage:', error);
    res.status(500).json({ error: 'Failed to fetch print usage' });
  }
});

router.post('/', validatePrintUsageInput, async (req, res) => {
  try {
    const {
      order_id, filament_id, quantity_used_kg, print_date,
      print_duration_mins, print_status, failure_reason, notes
    } = req.body;

    const usage = await printUsageModel.create({
      order_id: parseInt(order_id),
      filament_id: parseInt(filament_id),
      quantity_used_kg: parseFloat(quantity_used_kg),
      print_date: print_date || new Date().toISOString().split('T')[0],
      print_duration_mins: print_duration_mins ? parseInt(print_duration_mins) : null,
      print_status: print_status || 'success',
      failure_reason: failure_reason || null,
      notes: notes || null
    });

    res.status(201).json(usage);
  } catch (error) {
    console.error('Error creating print usage:', error);
    res.status(500).json({ error: error.message || 'Failed to create print usage' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await printUsageModel.remove(req.params.id);
    res.json({ success: true, message: 'Print usage entry deleted and stock restored' });
  } catch (error) {
    console.error('Error deleting print usage:', error);
    if (error.message === 'Print usage entry not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to delete print usage' });
    }
  }
});

module.exports = router;
