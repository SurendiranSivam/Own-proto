const filamentModel = require('./filament');
const orderModel = require('./order');
const paymentModel = require('./payment');
const procurementModel = require('./procurement');
const supabase = require('../config/supabase');

async function getStats() {
  const [inventoryValue, stockByType, activeOrders, pendingReceivables, totalRevenue,
    vendorCount, filaments, printUsageStats] = await Promise.all([
      filamentModel.getInventoryValue(),
      filamentModel.getStockByType(),
      orderModel.getActive(),
      paymentModel.getPendingReceivables(),
      paymentModel.getTotalRevenue(),
      getVendorCount(),
      filamentModel.getAll(),
      getPrintUsageStats()
    ]);

  // Count low stock filaments
  const lowStockCount = filaments.filter(f =>
    (f.current_stock_kg || 0) <= (f.min_stock_alert_kg || 1)
  ).length;

  // Get pending deliveries count
  const allProcurement = await procurementModel.getAll();
  const pendingDeliveries = allProcurement.filter(p =>
    p.status === 'pending' || !p.final_delivery_date
  ).length;

  // Total stock
  const totalStock = filaments.reduce((sum, f) => sum + (f.current_stock_kg || 0), 0);

  return {
    inventoryValue: inventoryValue || 0,
    stockByType: stockByType || [],
    activeOrdersCount: activeOrders.length,
    pendingReceivables: pendingReceivables || 0,
    totalRevenue: totalRevenue || 0,
    vendorCount: vendorCount || 0,
    filamentCount: filaments.length,
    totalStock: totalStock,
    lowStockCount: lowStockCount,
    pendingDeliveries: pendingDeliveries,
    usedFilamentCost: printUsageStats.totalCost || 0,
    usedFilamentKg: printUsageStats.totalKg || 0
  };
}

async function getVendorCount() {
  const { count, error } = await supabase
    .from('vendors')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting vendor count:', error);
    return 0;
  }
  return count || 0;
}

async function getPrintUsageStats() {
  const { data, error } = await supabase
    .from('print_usage')
    .select('quantity_used_kg, cost_consumed');

  if (error) {
    console.error('Error getting print usage stats:', error);
    return { totalCost: 0, totalKg: 0 };
  }

  const totalKg = (data || []).reduce((sum, u) => sum + (u.quantity_used_kg || 0), 0);
  const totalCost = (data || []).reduce((sum, u) => sum + (u.cost_consumed || 0), 0);

  return { totalCost, totalKg };
}

async function getUpcomingETAs() {
  const [allProcurement, allOrders] = await Promise.all([
    procurementModel.getAll(),
    orderModel.getAll()
  ]);

  const procurementETAs = allProcurement
    .filter(p => (p.status === 'pending' || !p.final_delivery_date) && p.eta_delivery)
    .sort((a, b) => new Date(a.eta_delivery) - new Date(b.eta_delivery))
    .slice(0, 10);

  const orderETAs = allOrders
    .filter(o => (o.status === 'in_progress' || o.status === 'completed' || o.status === 'pending') && o.eta_delivery)
    .sort((a, b) => new Date(a.eta_delivery) - new Date(b.eta_delivery))
    .slice(0, 10);

  return {
    procurement: procurementETAs,
    orders: orderETAs
  };
}

async function getChartData() {
  const allOrders = await orderModel.getAll();
  const stockByType = await filamentModel.getStockByType();

  // Order status distribution
  const orderStatusCounts = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    delivered: 0,
    cancelled: 0
  };

  // Payment status distribution
  const paymentStatusCounts = {
    pending: 0,
    partially_paid: 0,
    fully_paid: 0
  };

  // Revenue by status
  let totalRevenue = 0;
  let pendingRevenue = 0;
  let collectedRevenue = 0;

  allOrders.forEach(order => {
    // Count by status
    const status = order.status || 'pending';
    if (orderStatusCounts.hasOwnProperty(status)) {
      orderStatusCounts[status]++;
    }

    // Payment status
    const paymentStatus = order.payment_status || 'pending';
    if (paymentStatusCounts.hasOwnProperty(paymentStatus)) {
      paymentStatusCounts[paymentStatus]++;
    }

    // Revenue
    const amount = order.total_amount || 0;
    const balance = order.balance_amount || 0;
    totalRevenue += amount;
    pendingRevenue += balance;
    collectedRevenue += (amount - balance);
  });

  return {
    orderStatus: {
      labels: ['Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'],
      data: [
        orderStatusCounts.pending,
        orderStatusCounts.in_progress,
        orderStatusCounts.completed,
        orderStatusCounts.delivered,
        orderStatusCounts.cancelled
      ]
    },
    paymentStatus: {
      labels: ['Pending', 'Partially Paid', 'Fully Paid'],
      data: [
        paymentStatusCounts.pending,
        paymentStatusCounts.partially_paid,
        paymentStatusCounts.fully_paid
      ]
    },
    revenue: {
      labels: ['Total Revenue', 'Collected', 'Pending'],
      data: [totalRevenue, collectedRevenue, pendingRevenue]
    },
    stockByType: {
      labels: (stockByType || []).map(s => s.type),
      data: (stockByType || []).map(s => s.total_stock || 0)
    }
  };
}

module.exports = {
  getStats,
  getUpcomingETAs,
  getChartData
};
