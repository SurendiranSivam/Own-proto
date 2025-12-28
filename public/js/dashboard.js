let stats = {};
let upcomingETAs = {};

async function loadDashboard() {
  try {
    [stats, upcomingETAs] = await Promise.all([
      window.api.get('/dashboard/stats'),
      window.api.get('/dashboard/upcoming-etas')
    ]);
    renderDashboard();
  } catch (error) {
    console.error('Dashboard load error:', error);
    // Show error but don't break the page
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.textContent = 'Failed to load dashboard: ' + error.message;
    document.querySelector('.container-fluid').prepend(alert);
  }
}

function renderDashboard() {
  // Main stats
  const inventoryValue = document.getElementById('inventoryValue');
  const activeOrdersCount = document.getElementById('activeOrdersCount');
  const pendingReceivables = document.getElementById('pendingReceivables');
  const totalRevenue = document.getElementById('totalRevenue');

  if (inventoryValue) inventoryValue.textContent = window.api.formatCurrency(stats.inventoryValue || 0);
  if (activeOrdersCount) activeOrdersCount.textContent = stats.activeOrdersCount || 0;
  if (pendingReceivables) pendingReceivables.textContent = window.api.formatCurrency(stats.pendingReceivables || 0);
  if (totalRevenue) totalRevenue.textContent = window.api.formatCurrency(stats.totalRevenue || 0);

  // Quick stats
  const statVendors = document.getElementById('statVendors');
  const statFilaments = document.getElementById('statFilaments');
  const statStock = document.getElementById('statStock');
  const statPending = document.getElementById('statPending');
  const statLowStock = document.getElementById('statLowStock');

  if (statVendors) statVendors.textContent = stats.vendorCount || 0;
  if (statFilaments) statFilaments.textContent = stats.filamentCount || 0;
  if (statStock) statStock.textContent = (stats.totalStock || 0).toFixed(1) + ' kg';
  if (statPending) statPending.textContent = stats.pendingDeliveries || 0;
  if (statLowStock) statLowStock.textContent = stats.lowStockCount || 0;

  // Stock by type table
  const stockByTypeTable = document.getElementById('stockByTypeTable');
  if (stockByTypeTable) {
    if (stats.stockByType && stats.stockByType.length > 0) {
      stockByTypeTable.innerHTML = stats.stockByType.map(item => `
        <tr>
          <td>${item.type}</td>
          <td>${(item.total_stock || 0).toFixed(2)} kg</td>
          <td>${window.api.formatCurrency(item.total_value || 0)}</td>
        </tr>
      `).join('');
    } else {
      stockByTypeTable.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No stock data</td></tr>';
    }
  }

  // Recent orders table
  const recentOrdersTable = document.getElementById('recentOrdersTable');
  if (recentOrdersTable) {
    if (upcomingETAs.orders && upcomingETAs.orders.length > 0) {
      recentOrdersTable.innerHTML = upcomingETAs.orders.slice(0, 5).map(order => `
        <tr>
          <td>#${order.id}</td>
          <td>${order.customer_name || '-'}</td>
          <td>${window.api.formatCurrency(order.total_amount || 0)}</td>
          <td><span class="badge bg-${getStatusColor(order.status)}">${order.status}</span></td>
        </tr>
      `).join('');
    } else {
      recentOrdersTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No recent orders</td></tr>';
    }
  }

  // Procurement ETA table
  const procurementETATable = document.getElementById('procurementETATable');
  if (procurementETATable) {
    if (upcomingETAs.procurement && upcomingETAs.procurement.length > 0) {
      procurementETATable.innerHTML = upcomingETAs.procurement.slice(0, 5).map(p => `
        <tr>
          <td>${p.filament_type || '-'} ${p.filament_color || ''}</td>
          <td>${p.vendor_name || '-'}</td>
          <td>${window.api.formatDate(p.eta_delivery)}</td>
        </tr>
      `).join('');
    } else {
      procurementETATable.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No pending</td></tr>';
    }
  }

  // Order ETA table
  const orderETATable = document.getElementById('orderETATable');
  if (orderETATable) {
    if (upcomingETAs.orders && upcomingETAs.orders.length > 0) {
      orderETATable.innerHTML = upcomingETAs.orders.filter(o => o.eta_delivery).slice(0, 5).map(o => `
        <tr>
          <td>#${o.id}</td>
          <td>${o.customer_name || '-'}</td>
          <td>${window.api.formatDate(o.eta_delivery)}</td>
        </tr>
      `).join('');
    } else {
      orderETATable.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No pending</td></tr>';
    }
  }
}

function getStatusColor(status) {
  const colors = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    delivered: 'primary',
    cancelled: 'secondary'
  };
  return colors[status] || 'secondary';
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  setInterval(loadDashboard, 30000);
});
