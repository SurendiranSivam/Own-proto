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
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.textContent = 'Failed to load dashboard: ' + error.message;
    document.querySelector('.container-fluid').prepend(alert);
  }
}

function renderDashboard() {
  // Main stats
  setTextContent('inventoryValue', window.api.formatCurrency(stats.inventoryValue || 0));
  setTextContent('activeOrdersCount', stats.activeOrdersCount || 0);
  setTextContent('pendingReceivables', window.api.formatCurrency(stats.pendingReceivables || 0));
  setTextContent('totalRevenue', window.api.formatCurrency(stats.totalRevenue || 0));

  // Second row stats
  setTextContent('totalVendors', stats.vendorCount || 0);
  setTextContent('usedFilamentKg', (stats.usedFilamentKg || 0).toFixed(2) + ' kg');
  setTextContent('usedFilamentCost', window.api.formatCurrency(stats.usedFilamentCost || 0));
  setTextContent('lowStockItems', stats.lowStockCount || 0);

  // Quick stats
  setTextContent('statVendors', stats.vendorCount || 0);
  setTextContent('statFilaments', stats.filamentCount || 0);
  setTextContent('statStock', (stats.totalStock || 0).toFixed(1) + ' kg');
  setTextContent('statPending', stats.pendingDeliveries || 0);
  setTextContent('statLowStock', stats.lowStockCount || 0);

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

  // Recent orders table - with priority column
  const recentOrdersTable = document.getElementById('recentOrdersTable');
  if (recentOrdersTable) {
    if (upcomingETAs.orders && upcomingETAs.orders.length > 0) {
      recentOrdersTable.innerHTML = upcomingETAs.orders.slice(0, 5).map(order => `
        <tr>
          <td>#${order.id}</td>
          <td>${order.customer_name || '-'}</td>
          <td>${window.api.formatCurrency(order.total_amount || 0)}</td>
          <td><span class="badge bg-${getPriorityColor(order.priority)}">${(order.priority || 'normal').toUpperCase()}</span></td>
          <td><span class="badge bg-${getStatusColor(order.status)}">${(order.status || 'pending').replace('_', ' ').toUpperCase()}</span></td>
        </tr>
      `).join('');
    } else {
      recentOrdersTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No recent orders</td></tr>';
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

  // Order Deliveries table - show ONLY delivered orders
  const orderETATable = document.getElementById('orderETATable');
  if (orderETATable) {
    const deliveredOrders = (upcomingETAs.orders || []).filter(o => o.status === 'delivered');
    if (deliveredOrders.length > 0) {
      orderETATable.innerHTML = deliveredOrders.slice(0, 5).map(o => `
        <tr>
          <td>#${o.id}</td>
          <td>${o.customer_name || '-'}</td>
          <td>${window.api.formatDate(o.final_delivery_date || o.eta_delivery)}</td>
        </tr>
      `).join('');
    } else {
      orderETATable.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No delivered orders</td></tr>';
    }
  }
}

function setTextContent(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
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

function getPriorityColor(priority) {
  const colors = {
    urgent: 'danger',
    express: 'warning',
    normal: 'secondary'
  };
  return colors[priority] || 'secondary';
}

// KPI Charts
let orderStatusChart = null;
let revenueChart = null;
let stockChart = null;
let paymentChart = null;

async function loadCharts() {
  try {
    const chartData = await window.api.get('/dashboard/chart-data');
    renderCharts(chartData);
  } catch (error) {
    console.error('Failed to load chart data:', error);
  }
}

function renderCharts(data) {
  // Chart color palettes
  const statusColors = ['#ffc107', '#17a2b8', '#28a745', '#007bff', '#dc3545'];
  const paymentColors = ['#dc3545', '#ffc107', '#28a745'];
  const revenueColors = ['#6f42c1', '#28a745', '#ffc107'];
  const stockColors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];

  // Order Status Doughnut Chart
  const orderStatusCtx = document.getElementById('orderStatusChart');
  if (orderStatusCtx) {
    if (orderStatusChart) orderStatusChart.destroy();
    orderStatusChart = new Chart(orderStatusCtx, {
      type: 'doughnut',
      data: {
        labels: data.orderStatus.labels,
        datasets: [{
          data: data.orderStatus.data,
          backgroundColor: statusColors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
  }

  // Revenue Bar Chart
  const revenueCtx = document.getElementById('revenueChart');
  if (revenueCtx) {
    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(revenueCtx, {
      type: 'bar',
      data: {
        labels: data.revenue.labels,
        datasets: [{
          label: 'Amount (₹)',
          data: data.revenue.data,
          backgroundColor: revenueColors
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return '₹' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  // Stock by Type Pie Chart
  const stockCtx = document.getElementById('stockChart');
  if (stockCtx) {
    if (stockChart) stockChart.destroy();
    stockChart = new Chart(stockCtx, {
      type: 'pie',
      data: {
        labels: data.stockByType.labels.length > 0 ? data.stockByType.labels : ['No Data'],
        datasets: [{
          data: data.stockByType.data.length > 0 ? data.stockByType.data : [1],
          backgroundColor: stockColors
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
  }

  // Payment Status Doughnut Chart
  const paymentCtx = document.getElementById('paymentChart');
  if (paymentCtx) {
    if (paymentChart) paymentChart.destroy();
    paymentChart = new Chart(paymentCtx, {
      type: 'doughnut',
      data: {
        labels: data.paymentStatus.labels,
        datasets: [{
          data: data.paymentStatus.data,
          backgroundColor: paymentColors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  loadCharts();
  setInterval(() => {
    loadDashboard();
    loadCharts();
  }, 30000);
});
