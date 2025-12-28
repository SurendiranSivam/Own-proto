const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Import Supabase models
const filamentModel = require('../models/filament');
const vendorModel = require('../models/vendor');
const orderModel = require('../models/order');
const paymentModel = require('../models/payment');
const procurementModel = require('../models/procurement');

router.get('/inventory', async (req, res) => {
  try {
    const filaments = await filamentModel.getAll();

    const data = filaments.map(f => ({
      type: f.type,
      brand: f.brand,
      color: f.color,
      diameter: f.diameter,
      current_stock_kg: f.current_stock_kg || 0,
      cost_per_kg: f.cost_per_kg,
      inventory_value: (f.current_stock_kg || 0) * (f.cost_per_kg || 0),
      vendor_name: f.vendor_name
    })).sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.brand.localeCompare(b.brand);
    });

    const csvWriter = createCsvWriter({
      path: 'temp_inventory.csv',
      header: [
        { id: 'type', title: 'Type' },
        { id: 'brand', title: 'Brand' },
        { id: 'color', title: 'Color' },
        { id: 'diameter', title: 'Diameter' },
        { id: 'current_stock_kg', title: 'Stock (kg)' },
        { id: 'cost_per_kg', title: 'Cost per kg (INR)' },
        { id: 'inventory_value', title: 'Inventory Value (INR)' },
        { id: 'vendor_name', title: 'Vendor' }
      ]
    });

    await csvWriter.writeRecords(data);
    res.download('temp_inventory.csv', 'inventory_report.csv', () => {
      if (fs.existsSync('temp_inventory.csv')) {
        fs.unlinkSync('temp_inventory.csv');
      }
    });
  } catch (error) {
    console.error('Error exporting inventory:', error);
    res.status(500).json({ error: 'Failed to export inventory' });
  }
});

router.get('/procurement', async (req, res) => {
  try {
    const procurement = await procurementModel.getAll();

    const data = procurement.map(p => ({
      order_date: p.order_date,
      vendor_name: p.vendor_name,
      filament_type: p.filament_type,
      filament_brand: p.filament_brand,
      filament_color: p.filament_color,
      quantity_kg: p.quantity_kg,
      cost_per_kg: p.cost_per_kg,
      total_amount: p.total_amount,
      eta_delivery: p.eta_delivery,
      final_delivery_date: p.final_delivery_date,
      invoice_number: p.invoice_number,
      status: p.status
    })).sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

    const csvWriter = createCsvWriter({
      path: 'temp_procurement.csv',
      header: [
        { id: 'order_date', title: 'Order Date' },
        { id: 'vendor_name', title: 'Vendor' },
        { id: 'filament_type', title: 'Filament Type' },
        { id: 'filament_brand', title: 'Brand' },
        { id: 'filament_color', title: 'Color' },
        { id: 'quantity_kg', title: 'Quantity (kg)' },
        { id: 'cost_per_kg', title: 'Cost per kg (INR)' },
        { id: 'total_amount', title: 'Total Amount (INR)' },
        { id: 'eta_delivery', title: 'ETA Delivery' },
        { id: 'final_delivery_date', title: 'Delivery Date' },
        { id: 'invoice_number', title: 'Invoice Number' },
        { id: 'status', title: 'Status' }
      ]
    });

    await csvWriter.writeRecords(data);
    res.download('temp_procurement.csv', 'procurement_report.csv', () => {
      if (fs.existsSync('temp_procurement.csv')) {
        fs.unlinkSync('temp_procurement.csv');
      }
    });
  } catch (error) {
    console.error('Error exporting procurement:', error);
    res.status(500).json({ error: 'Failed to export procurement' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await orderModel.getAll();

    const data = orders.map(o => ({
      id: o.id,
      customer_name: o.customer_name,
      contact_number: o.contact_number,
      order_description: o.order_description,
      print_type: o.print_type,
      filament_type: o.filament_type,
      filament_color: o.filament_color,
      order_date: o.order_date,
      eta_delivery: o.eta_delivery,
      final_delivery_date: o.final_delivery_date,
      total_amount: o.total_amount,
      advance_amount: o.advance_amount,
      balance_amount: o.balance_amount,
      payment_status: o.payment_status,
      status: o.status
    })).sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

    const csvWriter = createCsvWriter({
      path: 'temp_orders.csv',
      header: [
        { id: 'id', title: 'Order ID' },
        { id: 'customer_name', title: 'Customer' },
        { id: 'contact_number', title: 'Contact' },
        { id: 'order_description', title: 'Description' },
        { id: 'print_type', title: 'Print Type' },
        { id: 'filament_type', title: 'Filament Type' },
        { id: 'filament_color', title: 'Color' },
        { id: 'order_date', title: 'Order Date' },
        { id: 'eta_delivery', title: 'ETA' },
        { id: 'final_delivery_date', title: 'Delivery Date' },
        { id: 'total_amount', title: 'Total (INR)' },
        { id: 'advance_amount', title: 'Advance (INR)' },
        { id: 'balance_amount', title: 'Balance (INR)' },
        { id: 'payment_status', title: 'Payment Status' },
        { id: 'status', title: 'Order Status' }
      ]
    });

    await csvWriter.writeRecords(data);
    res.download('temp_orders.csv', 'orders_report.csv', () => {
      if (fs.existsSync('temp_orders.csv')) {
        fs.unlinkSync('temp_orders.csv');
      }
    });
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({ error: 'Failed to export orders' });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const payments = await paymentModel.getAll();

    const data = payments.map(p => ({
      id: p.id,
      order_id: p.order_id,
      customer_name: p.customer_name,
      amount: p.amount,
      payment_type: p.payment_type,
      payment_date: p.payment_date,
      notes: p.notes
    })).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

    const csvWriter = createCsvWriter({
      path: 'temp_payments.csv',
      header: [
        { id: 'id', title: 'Payment ID' },
        { id: 'order_id', title: 'Order ID' },
        { id: 'customer_name', title: 'Customer' },
        { id: 'amount', title: 'Amount (INR)' },
        { id: 'payment_type', title: 'Type' },
        { id: 'payment_date', title: 'Payment Date' },
        { id: 'notes', title: 'Notes' }
      ]
    });

    await csvWriter.writeRecords(data);
    res.download('temp_payments.csv', 'payments_report.csv', () => {
      if (fs.existsSync('temp_payments.csv')) {
        fs.unlinkSync('temp_payments.csv');
      }
    });
  } catch (error) {
    console.error('Error exporting payments:', error);
    res.status(500).json({ error: 'Failed to export payments' });
  }
});

router.get('/monthly-summary', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const [orders, payments, procurement] = await Promise.all([
      orderModel.getAll(),
      paymentModel.getAll(),
      procurementModel.getAll()
    ]);

    const monthOrders = orders.filter(o => o.order_date && o.order_date.startsWith(month));
    const monthPayments = payments.filter(p => p.payment_date && p.payment_date.startsWith(month));
    const monthProcurement = procurement.filter(p => p.order_date && p.order_date.startsWith(month));

    const summary = [{
      month: month,
      total_orders: monthOrders.length,
      total_order_value: monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      total_advance_received: monthOrders.reduce((sum, o) => sum + (o.advance_amount || 0), 0),
      total_payments_received: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      total_procurement_spend: monthProcurement.reduce((sum, p) => sum + (p.total_amount || 0), 0)
    }];

    const csvWriter = createCsvWriter({
      path: 'temp_monthly_summary.csv',
      header: [
        { id: 'month', title: 'Month' },
        { id: 'total_orders', title: 'Total Orders' },
        { id: 'total_order_value', title: 'Order Value (INR)' },
        { id: 'total_advance_received', title: 'Advance Received (INR)' },
        { id: 'total_payments_received', title: 'Payments Received (INR)' },
        { id: 'total_procurement_spend', title: 'Procurement Spend (INR)' }
      ]
    });

    await csvWriter.writeRecords(summary);
    res.download('temp_monthly_summary.csv', `monthly_summary_${month}.csv`, () => {
      if (fs.existsSync('temp_monthly_summary.csv')) {
        fs.unlinkSync('temp_monthly_summary.csv');
      }
    });
  } catch (error) {
    console.error('Error exporting monthly summary:', error);
    res.status(500).json({ error: 'Failed to export monthly summary' });
  }
});

module.exports = router;
