let procurement = [];
let vendors = [];
let filaments = [];
let tableManager = null;

async function loadData() {
  try {
    [procurement, vendors, filaments] = await Promise.all([
      window.api.get('/procurement'),
      window.api.get('/vendors'),
      window.api.get('/inventory')
    ]);

    populateDropdowns();
    if (tableManager) {
      tableManager.setData(procurement);
    }
  } catch (error) {
    window.api.showNotification('Failed to load data: ' + error.message, 'error');
  }
}

function populateDropdowns() {
  const vendorSelect = document.getElementById('procurementVendor');
  vendorSelect.innerHTML = '<option value="">Select Vendor</option>';
  vendors.forEach(v => {
    vendorSelect.innerHTML += `<option value="${v.id}">${v.name}</option>`;
  });

  // Update filaments when vendor changes
  vendorSelect.addEventListener('change', () => {
    updateFilamentsByVendor(vendorSelect.value);
  });

  // Initially show all filaments
  updateFilamentsByVendor('');
}

function updateFilamentsByVendor(vendorId) {
  const filamentSelect = document.getElementById('procurementFilament');
  filamentSelect.innerHTML = '<option value="">Select Filament</option>';

  let filteredFilaments = filaments;
  if (vendorId) {
    // Filter to only show filaments from this vendor
    filteredFilaments = filaments.filter(f => f.vendor_id == vendorId);
  }

  filteredFilaments.forEach(f => {
    filamentSelect.innerHTML += `<option value="${f.id}">${f.type} - ${f.brand} (${f.color})</option>`;
  });

  if (vendorId && filteredFilaments.length === 0) {
    filamentSelect.innerHTML = '<option value="">No filaments for this vendor</option>';
  }
}

function initTable() {
  tableManager = new TableManager({
    containerId: 'procurementTable',
    pageSize: 10,
    exportFilename: 'procurement',
    columns: [
      { field: 'id', label: 'ID', render: (val) => `#${val}` },
      { field: 'vendor_name', label: 'Vendor' },
      { field: 'filament_type', label: 'Filament', render: (val, item) => `${val || ''} ${item.filament_color || ''}` },
      { field: 'quantity_kg', label: 'Qty (kg)' },
      { field: 'total_amount', label: 'Total', render: (val) => window.api.formatCurrency(val) },
      { field: 'order_date', label: 'Order Date', render: (val) => window.api.formatDate(val) },
      { field: 'eta_delivery', label: 'ETA', render: (val) => val ? window.api.formatDate(val) : '-' },
      {
        field: 'status', label: 'Status', render: (val) => {
          const colors = { delivered: 'success', shipped: 'info', pending: 'warning', delayed: 'danger' };
          return `<span class="badge bg-${colors[val] || 'secondary'}">${(val || 'pending').toUpperCase()}</span>`;
        }
      },
      {
        field: 'payment_status', label: 'Payment', render: (val) => {
          const colors = { paid: 'success', partial: 'warning', pending: 'danger' };
          return `<span class="badge bg-${colors[val] || 'secondary'}">${(val || 'pending').toUpperCase()}</span>`;
        }
      },
      { field: 'tracking_number', label: 'Tracking' }
    ],
    filters: [
      { field: 'vendor_name', label: 'Vendor', type: 'text', placeholder: 'Search...' },
      {
        field: 'status', label: 'Status', type: 'select', options: [
          { value: 'pending', label: 'Pending' },
          { value: 'shipped', label: 'Shipped' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'delayed', label: 'Delayed' }
        ]
      },
      {
        field: 'payment_status', label: 'Payment', type: 'select', options: [
          { value: 'pending', label: 'Pending' },
          { value: 'paid', label: 'Paid' },
          { value: 'partial', label: 'Partial' }
        ]
      }
    ],
    onEdit: showDeliveryForm,
    onDelete: null
  });
}

function showProcurementForm() {
  document.getElementById('procurementOrderDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('procurementForm').classList.remove('d-none');
}

function hideProcurementForm() {
  document.getElementById('procurementForm').classList.add('d-none');
  document.getElementById('procurementFormElement').reset();
}

function showDeliveryForm(id) {
  const item = procurement.find(p => p.id === id);
  if (!item || item.status === 'delivered') {
    window.api.showNotification('Already delivered or not found', 'error');
    return;
  }

  document.getElementById('deliveryId').value = id;
  document.getElementById('deliveryDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('deliveryInvoice').value = item.invoice_number || '';
  document.getElementById('deliveryForm').classList.remove('d-none');
}

function hideDeliveryForm() {
  document.getElementById('deliveryForm').classList.add('d-none');
  document.getElementById('deliveryFormElement').reset();
}

function calculateTotal() {
  const qty = parseFloat(document.getElementById('procurementQuantity').value) || 0;
  const cost = parseFloat(document.getElementById('procurementCost').value) || 0;
  document.getElementById('procurementTotal').textContent = window.api.formatCurrency(qty * cost);
}

async function saveProcurement(e) {
  e.preventDefault();

  // Clear previous validation errors
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

  const data = {
    vendor_id: document.getElementById('procurementVendor').value,
    filament_id: document.getElementById('procurementFilament').value,
    quantity_kg: document.getElementById('procurementQuantity').value,
    cost_per_kg: document.getElementById('procurementCost').value,
    order_date: document.getElementById('procurementOrderDate').value,
    eta_delivery: document.getElementById('procurementETA').value || null,
    invoice_number: document.getElementById('procurementInvoice').value || null,
    tracking_number: document.getElementById('procurementTracking').value || null,
    payment_status: document.getElementById('procurementPaymentStatus').value || null,
    notes: document.getElementById('procurementNotes').value || null
  };

  const errors = [];

  // Validate required fields
  if (!data.vendor_id) {
    errors.push('Vendor is required');
    document.getElementById('procurementVendor').classList.add('is-invalid');
  }

  if (!data.filament_id) {
    errors.push('Filament is required');
    document.getElementById('procurementFilament').classList.add('is-invalid');
  }

  if (!data.quantity_kg) {
    errors.push('Quantity is required');
    document.getElementById('procurementQuantity').classList.add('is-invalid');
  }

  if (!data.cost_per_kg) {
    errors.push('Cost per kg is required');
    document.getElementById('procurementCost').classList.add('is-invalid');
  }

  // Validate order date - cannot be in future
  if (data.order_date) {
    const orderDate = new Date(data.order_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (orderDate > today) {
      errors.push('Order date cannot be in the future');
      document.getElementById('procurementOrderDate').classList.add('is-invalid');
    }
  }

  // Payment status mandatory
  if (!data.payment_status) {
    errors.push('Payment status is required');
    document.getElementById('procurementPaymentStatus').classList.add('is-invalid');
  }

  if (errors.length > 0) {
    window.api.showNotification(errors.join('. '), 'error');
    return;
  }

  try {
    await window.api.post('/procurement', data);
    window.api.showNotification('Procurement order created', 'success');
    hideProcurementForm();
    loadData();
  } catch (error) {
    window.api.showNotification('Failed: ' + error.message, 'error');
  }
}

async function markDelivered(e) {
  e.preventDefault();

  const id = document.getElementById('deliveryId').value;
  const data = {
    final_delivery_date: document.getElementById('deliveryDate').value,
    invoice_number: document.getElementById('deliveryInvoice').value.trim()
  };

  try {
    await window.api.put(`/procurement/${id}`, data);
    window.api.showNotification('Marked as delivered. Stock updated!', 'success');
    hideDeliveryForm();
    loadData();
  } catch (error) {
    window.api.showNotification('Failed: ' + error.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTable();
  loadData();

  document.getElementById('procurementFormElement').addEventListener('submit', saveProcurement);
  document.getElementById('cancelProcurementBtn').addEventListener('click', hideProcurementForm);
  document.getElementById('addProcurementBtn').addEventListener('click', showProcurementForm);

  document.getElementById('deliveryFormElement').addEventListener('submit', markDelivered);
  document.getElementById('cancelDeliveryBtn').addEventListener('click', hideDeliveryForm);

  document.getElementById('procurementQuantity').addEventListener('input', calculateTotal);
  document.getElementById('procurementCost').addEventListener('input', calculateTotal);

  // Multi-color checkbox handling
  const procColorCheckboxes = document.querySelectorAll('.proc-color-check');
  const procColorDropdownBtn = document.getElementById('procColorDropdownBtn');
  const procColorHiddenInput = document.getElementById('procurementColors');

  function updateProcSelectedColors() {
    const selectedColors = [];
    procColorCheckboxes.forEach(cb => {
      if (cb.checked) selectedColors.push(cb.value);
    });

    if (selectedColors.length === 0) {
      procColorDropdownBtn.textContent = 'Select Colors';
    } else if (selectedColors.length <= 3) {
      procColorDropdownBtn.textContent = selectedColors.join(', ');
    } else {
      procColorDropdownBtn.textContent = `${selectedColors.length} colors selected`;
    }

    if (procColorHiddenInput) {
      procColorHiddenInput.value = selectedColors.join(', ');
    }
  }

  procColorCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateProcSelectedColors);
  });
});
