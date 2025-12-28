const express = require('express');
const router = express.Router();
const orderModel = require('../models/order');
const { validateOrder, validationMiddleware } = require('../utils/validators');

// Apply validation middleware
const validateOrderInput = validationMiddleware(validateOrder);

router.get('/', async (req, res) => {
  try {
    const orders = await orderModel.getAll();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/active/list', async (req, res) => {
  try {
    const orders = await orderModel.getActive();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({ error: 'Failed to fetch active orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/', validateOrderInput, async (req, res) => {
  try {
    const {
      customer_name, customer_email, contact_number, delivery_address,
      order_description, print_type, filament_type, filament_color,
      estimated_quantity_units, estimated_filament_usage_kg,
      order_date, eta_delivery, total_amount, advance_percentage,
      discount_percentage, gst_percentage, priority, notes
    } = req.body;

    // Calculate discount and GST amounts
    const totalAmt = parseFloat(total_amount);
    const discountPct = parseFloat(discount_percentage) || 0;
    const gstPct = parseFloat(gst_percentage) || 0;

    const discountAmt = (totalAmt * discountPct) / 100;
    const gstAmt = ((totalAmt - discountAmt) * gstPct) / 100;

    const order = await orderModel.create({
      customer_name,
      customer_email: customer_email || null,
      contact_number: contact_number || null,
      delivery_address: delivery_address || null,
      order_description: order_description || null,
      print_type: print_type || null,
      filament_type: filament_type || null,
      filament_color: filament_color || null,
      estimated_quantity_units: estimated_quantity_units ? parseInt(estimated_quantity_units) : null,
      estimated_filament_usage_kg: estimated_filament_usage_kg ? parseFloat(estimated_filament_usage_kg) : null,
      order_date,
      eta_delivery: eta_delivery || null,
      total_amount: totalAmt,
      advance_percentage: parseFloat(advance_percentage) || 0,
      discount_percentage: discountPct,
      discount_amount: discountAmt,
      gst_percentage: gstPct,
      gst_amount: gstAmt,
      priority: priority || 'normal',
      notes: notes || null
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.put('/:id', validateOrderInput, async (req, res) => {
  try {
    const {
      customer_name, customer_email, contact_number, delivery_address,
      order_description, print_type, filament_type, filament_color,
      estimated_quantity_units, estimated_filament_usage_kg,
      order_date, eta_delivery, total_amount, advance_percentage,
      discount_percentage, gst_percentage, priority, notes,
      final_delivery_date, status
    } = req.body;

    // Calculate discount and GST amounts
    const totalAmt = parseFloat(total_amount);
    const discountPct = parseFloat(discount_percentage) || 0;
    const gstPct = parseFloat(gst_percentage) || 0;

    const discountAmt = (totalAmt * discountPct) / 100;
    const gstAmt = ((totalAmt - discountAmt) * gstPct) / 100;

    const order = await orderModel.update(req.params.id, {
      customer_name,
      customer_email: customer_email || null,
      contact_number: contact_number || null,
      delivery_address: delivery_address || null,
      order_description: order_description || null,
      print_type: print_type || null,
      filament_type: filament_type || null,
      filament_color: filament_color || null,
      estimated_quantity_units: estimated_quantity_units ? parseInt(estimated_quantity_units) : null,
      estimated_filament_usage_kg: estimated_filament_usage_kg ? parseFloat(estimated_filament_usage_kg) : null,
      order_date,
      eta_delivery: eta_delivery || null,
      total_amount: totalAmt,
      advance_percentage: parseFloat(advance_percentage) || 0,
      discount_percentage: discountPct,
      discount_amount: discountAmt,
      gst_percentage: gstPct,
      gst_amount: gstAmt,
      priority: priority || 'normal',
      notes: notes || null,
      final_delivery_date: final_delivery_date || null,
      status: status || 'in_progress'
    });

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.message === 'Order not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update order' });
    }
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await orderModel.remove(req.params.id);
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    if (error.message === 'Order not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete order' });
    }
  }
});

module.exports = router;
