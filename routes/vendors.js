const express = require('express');
const router = express.Router();
const vendorModel = require('../models/vendor');
const { validateVendor, validationMiddleware } = require('../utils/validators');

// Apply validation middleware
const validateVendorInput = validationMiddleware(validateVendor);

router.get('/', async (req, res) => {
  try {
    const vendors = await vendorModel.getAll();
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vendor = await vendorModel.getById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

router.post('/', validateVendorInput, async (req, res) => {
  try {
    const {
      name, contact, email, address, state, pincode,
      gst, payment_terms, notes, is_active
    } = req.body;

    const vendor = await vendorModel.create({
      name,
      contact: contact || null,
      email: email || null,
      address: address || null,
      state: state || null,
      pincode: pincode || null,
      gst: gst || null,
      payment_terms: payment_terms || 'advance',
      notes: notes || null,
      is_active: is_active !== false
    });
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

router.put('/:id', validateVendorInput, async (req, res) => {
  try {
    const {
      name, contact, email, address, state, pincode,
      gst, payment_terms, notes, is_active
    } = req.body;

    const vendor = await vendorModel.update(req.params.id, {
      name,
      contact: contact || null,
      email: email || null,
      address: address || null,
      state: state || null,
      pincode: pincode || null,
      gst: gst || null,
      payment_terms: payment_terms || 'advance',
      notes: notes || null,
      is_active: is_active !== false
    });
    res.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    if (error.message === 'Vendor not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update vendor' });
    }
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await vendorModel.remove(req.params.id);
    res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    if (error.message === 'Vendor not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete vendor' });
    }
  }
});

module.exports = router;
