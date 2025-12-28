let usage = [];
let orders = [];
let filaments = [];
let tableManager = null;

async function loadData() {
  try {
    [usage, orders, filaments] = await Promise.all([
      window.api.get('/print-usage'),
      window.api.get('/orders'),
      window.api.get('/inventory')
    ]);

    populateDropdowns();
    if (tableManager) {
      tableManager.setData(usage);
    }
  } catch (error) {
    window.api.showNotification('Failed to load data: ' + error.message, 'error');
  }
}

function populateDropdowns() {
  const orderSelect = document.getElementById('usageOrder');
  orderSelect.innerHTML = '<option value="">Select Order</option>';
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    orderSelect.innerHTML += `<option value="${o.id}">#${o.id} - ${o.customer_name}</option>`;
  });

  const filamentSelect = document.getElementById('usageFilament');
  filamentSelect.innerHTML = '<option value="">Select Filament</option>';
  filaments.filter(f => (f.current_stock_kg || 0) > 0).forEach(f => {
    filamentSelect.innerHTML += `<option value="${f.id}">${f.type} - ${f.brand} (${f.color}) - ${f.current_stock_kg}kg</option>`;
  });
}

function initTable() {
  tableManager = new TableManager({
    containerId: 'usageTable',
    pageSize: 10,
    exportFilename: 'print_usage',
    columns: [
      { field: 'id', label: 'ID', render: (val) => `#${val}` },
      { field: 'order_id', label: 'Order', render: (val) => `#${val}` },
      { field: 'customer_name', label: 'Customer' },
      { field: 'filament_type', label: 'Filament', render: (val, item) => `${val || ''} ${item.filament_color || ''}` },
      { field: 'quantity_used_kg', label: 'Used (kg)', render: (val) => val ? val.toFixed(3) : '-' },
      { field: 'cost_consumed', label: 'Cost', render: (val) => window.api.formatCurrency(val || 0) },
      { field: 'print_date', label: 'Date', render: (val) => window.api.formatDate(val) },
      { field: 'print_duration_mins', label: 'Duration', render: (val) => val ? `${val} mins` : '-' },
      {
        field: 'print_status', label: 'Status', render: (val) => {
          const colors = { success: 'success', failed: 'danger', partial: 'warning' };
          return `<span class="badge bg-${colors[val] || 'secondary'}">${(val || 'success').toUpperCase()}</span>`;
        }
      }
    ],
    filters: [
      { field: 'customer_name', label: 'Customer', type: 'text', placeholder: 'Search...' },
      {
        field: 'print_status', label: 'Status', type: 'select', options: [
          { value: 'success', label: 'Success' },
          { value: 'failed', label: 'Failed' },
          { value: 'partial', label: 'Partial' }
        ]
      },
      { field: 'print_date', label: 'Date', type: 'date' }
    ],
    onEdit: null,
    onDelete: deleteUsage
  });
}

function showUsageForm() {
  document.getElementById('usageDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('usageForm').classList.remove('d-none');
}

function hideUsageForm() {
  document.getElementById('usageForm').classList.add('d-none');
  document.getElementById('usageFormElement').reset();
}

async function saveUsage(e) {
  e.preventDefault();

  const data = {
    order_id: document.getElementById('usageOrder').value,
    filament_id: document.getElementById('usageFilament').value,
    quantity_used_kg: document.getElementById('usageQuantity').value,
    print_date: document.getElementById('usageDate').value || new Date().toISOString().split('T')[0],
    print_duration_mins: document.getElementById('usageDuration').value || null,
    print_status: document.getElementById('usageStatus').value,
    failure_reason: document.getElementById('usageFailureReason').value.trim(),
    notes: document.getElementById('usageNotes').value.trim()
  };

  if (!data.order_id || !data.filament_id || !data.quantity_used_kg) {
    window.api.showNotification('Order, filament, and quantity are required', 'error');
    return;
  }

  try {
    await window.api.post('/print-usage', data);
    window.api.showNotification('Usage logged. Stock updated!', 'success');
    hideUsageForm();
    loadData();
  } catch (error) {
    window.api.showNotification('Failed: ' + error.message, 'error');
  }
}

async function deleteUsage(id) {
  if (!confirm('Delete this usage entry? Stock will be restored.')) {
    return;
  }

  try {
    await window.api.del(`/print-usage/${id}`);
    window.api.showNotification('Entry deleted. Stock restored.', 'success');
    loadData();
  } catch (error) {
    window.api.showNotification('Failed: ' + error.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTable();
  loadData();
  document.getElementById('usageFormElement').addEventListener('submit', saveUsage);
  document.getElementById('cancelUsageBtn').addEventListener('click', hideUsageForm);
  document.getElementById('addUsageBtn').addEventListener('click', showUsageForm);
});

window.deleteUsage = deleteUsage;
