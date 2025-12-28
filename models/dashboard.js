const filamentModel = require('./filament');
const orderModel = require('./order');
const paymentModel = require('./payment');
const procurementModel = require('./procurement');

async function getStats() {
  const [inventoryValue, stockByType, activeOrders, pendingReceivables, totalRevenue] = await Promise.all([
    filamentModel.getInventoryValue(),
    filamentModel.getStockByType(),
    orderModel.getActive(),
    paymentModel.getPendingReceivables(),
    paymentModel.getTotalRevenue()
  ]);

  return {
    inventoryValue: inventoryValue || 0,
    stockByType: stockByType || [],
    activeOrdersCount: activeOrders.length,
    pendingReceivables: pendingReceivables || 0,
    totalRevenue: totalRevenue || 0
  };
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
    .filter(o => (o.status === 'in_progress' || o.status === 'completed') && o.eta_delivery)
    .sort((a, b) => new Date(a.eta_delivery) - new Date(b.eta_delivery))
    .slice(0, 10);

  return {
    procurement: procurementETAs,
    orders: orderETAs
  };
}

module.exports = {
  getStats,
  getUpcomingETAs
};
