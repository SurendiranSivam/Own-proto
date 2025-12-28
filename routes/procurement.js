const express = require('express');
const router = express.Router();
const procurementModel = require('../models/procurement');
const { validateProcurement, validationMiddleware } = require('../utils/validators');

// Apply validation middleware
const validateProcurementInput = validationMiddleware(validateProcurement);

router.get('/', async (req, res) => {
  try {
    const procurement = await procurementModel.getAll();
    res.json(procurement);
  } catch (error) {
    console.error('Error fetching procurement:', error);
    res.status(500).json({ error: 'Failed to fetch procurement' });
  }
});

router.get('/pending/list', async (req, res) => {
  try {
    const pending = await procurementModel.getPending();
    res.json(pending);
  } catch (error) {
    console.error('Error fetching pending deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch pending deliveries' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const procurement = await procurementModel.getById(req.params.id);
    if (!procurement) {
      return res.status(404).json({ error: 'Procurement not found' });
    }
    res.json(procurement);
  } catch (error) {
    console.error('Error fetching procurement:', error);
    res.status(500).json({ error: 'Failed to fetch procurement' });
  }
});

router.post('/', validateProcurementInput, async (req, res) => {
  try {
    const {
      vendor_id, filament_id, quantity_kg, cost_per_kg,
      order_date, eta_delivery, invoice_number, tracking_number,
      notes, payment_status
    } = req.body;

    const procurement = await procurementModel.create({
      vendor_id: parseInt(vendor_id),
      filament_id: parseInt(filament_id),
      quantity_kg: parseFloat(quantity_kg),
      cost_per_kg: parseFloat(cost_per_kg),
      order_date: order_date || new Date().toISOString().split('T')[0],
      eta_delivery: eta_delivery || null,
      invoice_number: invoice_number || null,
      tracking_number: tracking_number || null,
      notes: notes || null,
      payment_status: payment_status || 'pending'
    });

    res.status(201).json(procurement);
  } catch (error) {
    console.error('Error creating procurement:', error);
    res.status(500).json({ error: 'Failed to create procurement' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      final_delivery_date, invoice_number, tracking_number,
      notes, payment_status
    } = req.body;

    if (!final_delivery_date && !invoice_number && !tracking_number && !notes && !payment_status) {
      return res.status(400).json({ error: 'At least one field is required for update' });
    }

    const updateData = {};
    if (final_delivery_date) updateData.final_delivery_date = final_delivery_date;
    if (invoice_number !== undefined) updateData.invoice_number = invoice_number || null;
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (payment_status) updateData.payment_status = payment_status;

    const procurement = await procurementModel.update(req.params.id, updateData);
    res.json(procurement);
  } catch (error) {
    console.error('Error updating procurement:', error);
    if (error.message === 'Procurement not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update procurement' });
    }
  }
});

module.exports = router;
