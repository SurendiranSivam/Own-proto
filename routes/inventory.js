const express = require('express');
const router = express.Router();
const filamentModel = require('../models/filament');
const { validateFilament, validationMiddleware } = require('../utils/validators');

// Apply validation middleware
const validateFilamentInput = validationMiddleware(validateFilament);

router.get('/', async (req, res) => {
  try {
    const filaments = await filamentModel.getAll();
    res.json(filaments);
  } catch (error) {
    console.error('Error fetching filaments:', error);
    res.status(500).json({ error: 'Failed to fetch filaments' });
  }
});

router.get('/alerts/low-stock', async (req, res) => {
  try {
    const alerts = await filamentModel.getLowStockAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ error: 'Failed to fetch low stock alerts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const filament = await filamentModel.getById(req.params.id);
    if (!filament) {
      return res.status(404).json({ error: 'Filament not found' });
    }
    res.json(filament);
  } catch (error) {
    console.error('Error fetching filament:', error);
    res.status(500).json({ error: 'Failed to fetch filament' });
  }
});

router.post('/', validateFilamentInput, async (req, res) => {
  try {
    const {
      type, brand, color, diameter, weight_per_spool_kg, cost_per_kg,
      vendor_id, min_stock_alert_kg, print_temp_min, print_temp_max,
      bed_temp, quality_grade, is_active
    } = req.body;

    const filament = await filamentModel.create({
      type: type.toUpperCase(),
      brand,
      color,
      diameter: diameter || '1.75mm',
      weight_per_spool_kg: parseFloat(weight_per_spool_kg) || 1,
      cost_per_kg: parseFloat(cost_per_kg),
      vendor_id: vendor_id ? parseInt(vendor_id) : null,
      min_stock_alert_kg: parseFloat(min_stock_alert_kg) || 1,
      print_temp_min: print_temp_min ? parseInt(print_temp_min) : null,
      print_temp_max: print_temp_max ? parseInt(print_temp_max) : null,
      bed_temp: bed_temp ? parseInt(bed_temp) : null,
      quality_grade: quality_grade || 'standard',
      is_active: is_active !== false
    });

    res.status(201).json(filament);
  } catch (error) {
    console.error('Error creating filament:', error);
    res.status(500).json({ error: 'Failed to create filament' });
  }
});

router.put('/:id', validateFilamentInput, async (req, res) => {
  try {
    const {
      type, brand, color, diameter, weight_per_spool_kg, cost_per_kg,
      vendor_id, min_stock_alert_kg, print_temp_min, print_temp_max,
      bed_temp, quality_grade, is_active
    } = req.body;

    const filament = await filamentModel.update(req.params.id, {
      type: type.toUpperCase(),
      brand,
      color,
      diameter: diameter || '1.75mm',
      weight_per_spool_kg: parseFloat(weight_per_spool_kg) || 1,
      cost_per_kg: parseFloat(cost_per_kg),
      vendor_id: vendor_id ? parseInt(vendor_id) : null,
      min_stock_alert_kg: parseFloat(min_stock_alert_kg) || 1,
      print_temp_min: print_temp_min ? parseInt(print_temp_min) : null,
      print_temp_max: print_temp_max ? parseInt(print_temp_max) : null,
      bed_temp: bed_temp ? parseInt(bed_temp) : null,
      quality_grade: quality_grade || 'standard',
      is_active: is_active !== false
    });

    res.json(filament);
  } catch (error) {
    console.error('Error updating filament:', error);
    if (error.message === 'Filament not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update filament' });
    }
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await filamentModel.remove(req.params.id);
    res.json({ success: true, message: 'Filament deleted successfully' });
  } catch (error) {
    console.error('Error deleting filament:', error);
    if (error.message === 'Filament not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete filament' });
    }
  }
});

module.exports = router;
