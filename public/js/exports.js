async function exportInventory() {
  try {
    window.api.showNotification('Exporting inventory report...', 'info');
    const response = await fetch('/api/exports/inventory');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    window.api.showNotification('Inventory report exported successfully', 'success');
  } catch (error) {
    window.api.showNotification('Failed to export inventory: ' + error.message, 'error');
  }
}

async function exportProcurement() {
  try {
    window.api.showNotification('Exporting procurement report...', 'info');
    const response = await fetch('/api/exports/procurement');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'procurement_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    window.api.showNotification('Procurement report exported successfully', 'success');
  } catch (error) {
    window.api.showNotification('Failed to export procurement: ' + error.message, 'error');
  }
}

async function exportOrders() {
  try {
    window.api.showNotification('Exporting orders report...', 'info');
    const response = await fetch('/api/exports/orders');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    window.api.showNotification('Orders report exported successfully', 'success');
  } catch (error) {
    window.api.showNotification('Failed to export orders: ' + error.message, 'error');
  }
}

async function exportPayments() {
  try {
    window.api.showNotification('Exporting payments report...', 'info');
    const response = await fetch('/api/exports/payments');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    window.api.showNotification('Payments report exported successfully', 'success');
  } catch (error) {
    window.api.showNotification('Failed to export payments: ' + error.message, 'error');
  }
}

async function exportMonthlySummary() {
  const month = document.getElementById('monthlySummaryMonth').value || 
                new Date().toISOString().slice(0, 7);
  
  try {
    window.api.showNotification('Exporting monthly summary...', 'info');
    const response = await fetch(`/api/exports/monthly-summary?month=${month}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly_summary_${month}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    window.api.showNotification('Monthly summary exported successfully', 'success');
  } catch (error) {
    window.api.showNotification('Failed to export monthly summary: ' + error.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('monthlySummaryMonth').value = new Date().toISOString().slice(0, 7);
});

window.exportInventory = exportInventory;
window.exportProcurement = exportProcurement;
window.exportOrders = exportOrders;
window.exportPayments = exportPayments;
window.exportMonthlySummary = exportMonthlySummary;

