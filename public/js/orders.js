let orders = [];
let editingId = null;
let tableManager = null;

async function loadOrders() {
  try {
    orders = await window.api.get('/orders');
    if (tableManager) {
      tableManager.setData(orders);
    }
  } catch (error) {
    window.api.showNotification('Failed to load orders: ' + error.message, 'error');
  }
}

function initTable() {
  tableManager = new TableManager({
    containerId: 'ordersTable',
    pageSize: 10,
    exportFilename: 'orders',
    columns: [
      {
        field: 'id', label: 'Invoice No', render: (val) => {
          const date = new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          return `INV-${year}${month}-${String(val).padStart(4, '0')}`;
        }
      },
      { field: 'customer_name', label: 'Customer' },
      { field: 'contact_number', label: 'Phone' },
      { field: 'order_date', label: 'Order Date', render: (val) => window.api.formatDate(val) },
      { field: 'eta_delivery', label: 'ETA', render: (val) => val ? window.api.formatDate(val) : '-' },
      { field: 'total_amount', label: 'Total', render: (val) => window.api.formatCurrency(val) },
      { field: 'balance_amount', label: 'Balance', render: (val) => window.api.formatCurrency(val || 0) },
      {
        field: 'priority', label: 'Priority', render: (val) => {
          const colors = { urgent: 'danger', express: 'warning', normal: 'secondary' };
          return `<span class="badge bg-${colors[val] || 'secondary'}">${(val || 'normal').toUpperCase()}</span>`;
        }
      },
      {
        field: 'status', label: 'Status', render: (val) => {
          const colors = { delivered: 'success', completed: 'info', in_progress: 'primary', pending: 'warning', cancelled: 'danger' };
          return `<span class="badge bg-${colors[val] || 'secondary'}">${(val || 'pending').replace('_', ' ').toUpperCase()}</span>`;
        }
      },
      {
        field: 'payment_status', label: 'Payment', render: (val) => {
          const colors = { fully_paid: 'success', partially_paid: 'warning', pending: 'danger' };
          return `<span class="badge bg-${colors[val] || 'secondary'}">${(val || 'pending').replace('_', ' ').toUpperCase()}</span>`;
        }
      },
      {
        field: 'id', label: 'Actions', render: (val) => {
          return `<button class="btn btn-sm btn-outline-primary" onclick="downloadInvoice(${val})" title="Download Invoice">📄 PDF</button>`;
        }
      }
    ],
    filters: [
      { field: 'customer_name', label: 'Customer', type: 'text', placeholder: 'Search name...' },
      { field: 'contact_number', label: 'Phone', type: 'text', placeholder: 'Search phone...' },
      {
        field: 'status', label: 'Status', type: 'select', options: [
          { value: 'pending', label: 'Pending' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      },
      {
        field: 'priority', label: 'Priority', type: 'select', options: [
          { value: 'normal', label: 'Normal' },
          { value: 'urgent', label: 'Urgent' },
          { value: 'express', label: 'Express' }
        ]
      },
      {
        field: 'payment_status', label: 'Payment', type: 'select', options: [
          { value: 'pending', label: 'Pending' },
          { value: 'partially_paid', label: 'Partially Paid' },
          { value: 'fully_paid', label: 'Fully Paid' }
        ]
      }
    ],
    onEdit: editOrder,
    onDelete: null // Orders typically shouldn't be deleted
  });
}

function showOrderForm(order = null) {
  editingId = order ? order.id : null;
  document.getElementById('orderCustomerName').value = order ? order.customer_name : '';
  document.getElementById('orderCustomerEmail').value = order ? order.customer_email || '' : '';
  document.getElementById('orderContact').value = order ? order.contact_number || '' : '';
  document.getElementById('orderDeliveryAddress').value = order ? order.delivery_address || '' : '';
  document.getElementById('orderDescription').value = order ? order.order_description || '' : '';
  document.getElementById('orderPrintType').value = order ? order.print_type || '' : '';
  document.getElementById('orderFilamentType').value = order ? order.filament_type || '' : '';
  document.getElementById('orderFilamentColor').value = order ? order.filament_color || '' : '';
  document.getElementById('orderPriority').value = order ? order.priority || 'normal' : 'normal';
  document.getElementById('orderQuantity').value = order ? order.estimated_quantity_units || '' : '';
  document.getElementById('orderFilamentUsage').value = order ? order.estimated_filament_usage_kg || '' : '';
  document.getElementById('orderDate').value = order ? order.order_date : new Date().toISOString().split('T')[0];
  document.getElementById('orderETA').value = order ? (order.eta_delivery || '') : '';
  document.getElementById('orderFinalDeliveryDate').value = order ? (order.final_delivery_date || '') : '';
  document.getElementById('orderTotalAmount').value = order ? order.total_amount : '';
  document.getElementById('orderAdvancePercentage').value = order ? order.advance_percentage || 0 : 0;
  document.getElementById('orderDiscountPercentage').value = order ? order.discount_percentage || 0 : 0;
  document.getElementById('orderGSTPercentage').value = order ? order.gst_percentage || 0 : 0;
  document.getElementById('orderStatus').value = order ? order.status : 'pending';
  document.getElementById('orderNotes').value = order ? order.notes || '' : '';

  calculateAmounts();
  document.getElementById('orderFormTitle').textContent = order ? 'Edit Order' : 'Add New Order';
  document.getElementById('orderForm').classList.remove('d-none');
}

function hideOrderForm() {
  document.getElementById('orderForm').classList.add('d-none');
  document.getElementById('orderFormElement').reset();
  editingId = null;
}

function calculateAmounts() {
  const totalAmount = parseFloat(document.getElementById('orderTotalAmount').value) || 0;
  const advancePercentage = parseFloat(document.getElementById('orderAdvancePercentage').value) || 0;
  const advanceAmount = (totalAmount * advancePercentage) / 100;
  const balanceAmount = totalAmount - advanceAmount;

  document.getElementById('orderAdvanceAmount').textContent = window.api.formatCurrency(advanceAmount);
  document.getElementById('orderBalanceAmount').textContent = window.api.formatCurrency(balanceAmount);
}

async function saveOrder(e) {
  e.preventDefault();

  // Clear previous validation
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

  const orderDate = document.getElementById('orderDate').value;
  const etaDelivery = document.getElementById('orderETA').value;
  const finalDeliveryDate = document.getElementById('orderFinalDeliveryDate').value;

  // Validate dates
  const errors = [];

  if (!document.getElementById('orderCustomerName').value.trim()) {
    document.getElementById('orderCustomerName').classList.add('is-invalid');
    errors.push('Customer name is required');
  }

  if (!document.getElementById('orderPrintType').value) {
    document.getElementById('orderPrintType').classList.add('is-invalid');
    errors.push('Print type is required');
  }

  if (!document.getElementById('orderFilamentType').value) {
    document.getElementById('orderFilamentType').classList.add('is-invalid');
    errors.push('Filament type is required');
  }

  if (!orderDate) {
    document.getElementById('orderDate').classList.add('is-invalid');
    errors.push('Order date is required');
  }

  if (!document.getElementById('orderTotalAmount').value) {
    document.getElementById('orderTotalAmount').classList.add('is-invalid');
    errors.push('Total amount is required');
  }

  // ETA cannot be before order date
  if (etaDelivery && orderDate && new Date(etaDelivery) < new Date(orderDate)) {
    document.getElementById('orderETA').classList.add('is-invalid');
    errors.push('ETA delivery cannot be before order date');
  }

  // Final delivery date cannot be before order date
  if (finalDeliveryDate && orderDate && new Date(finalDeliveryDate) < new Date(orderDate)) {
    document.getElementById('orderFinalDeliveryDate').classList.add('is-invalid');
    errors.push('Final delivery date cannot be before order date');
  }

  // Email validation if provided
  const email = document.getElementById('orderCustomerEmail').value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('orderCustomerEmail').classList.add('is-invalid');
    errors.push('Invalid email format');
  }

  // Phone validation if provided
  const phone = document.getElementById('orderContact').value.trim();
  if (phone && !/^[\d\s\-\+\(\)]{10,}$/.test(phone)) {
    document.getElementById('orderContact').classList.add('is-invalid');
    errors.push('Invalid phone number format');
  }

  if (errors.length > 0) {
    window.api.showNotification(errors.join('. '), 'error');
    return;
  }

  const orderData = {
    customer_name: document.getElementById('orderCustomerName').value.trim(),
    customer_email: document.getElementById('orderCustomerEmail').value.trim(),
    contact_number: document.getElementById('orderContact').value.trim(),
    delivery_address: document.getElementById('orderDeliveryAddress').value.trim(),
    order_description: document.getElementById('orderDescription').value.trim(),
    print_type: document.getElementById('orderPrintType').value,
    filament_type: document.getElementById('orderFilamentType').value,
    filament_color: document.getElementById('orderFilamentColor').value,
    priority: document.getElementById('orderPriority').value,
    estimated_quantity_units: document.getElementById('orderQuantity').value,
    estimated_filament_usage_kg: document.getElementById('orderFilamentUsage').value,
    order_date: orderDate,
    eta_delivery: etaDelivery || null,
    final_delivery_date: finalDeliveryDate || null,
    total_amount: parseFloat(document.getElementById('orderTotalAmount').value),
    advance_percentage: parseFloat(document.getElementById('orderAdvancePercentage').value) || 0,
    discount_percentage: parseFloat(document.getElementById('orderDiscountPercentage').value) || 0,
    gst_percentage: parseFloat(document.getElementById('orderGSTPercentage').value) || 0,
    status: document.getElementById('orderStatus').value,
    notes: document.getElementById('orderNotes').value.trim()
  };

  try {
    if (editingId) {
      await window.api.put(`/orders/${editingId}`, orderData);
      window.api.showNotification('Order updated successfully', 'success');
    } else {
      await window.api.post('/orders', orderData);
      window.api.showNotification('Order created successfully', 'success');
    }

    hideOrderForm();
    loadOrders();
  } catch (error) {
    window.api.showNotification('Failed to save order: ' + error.message, 'error');
  }
}

function editOrder(id) {
  const order = orders.find(o => o.id === id);
  if (order) {
    showOrderForm(order);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTable();
  loadOrders();
  document.getElementById('orderFormElement').addEventListener('submit', saveOrder);
  document.getElementById('cancelOrderBtn').addEventListener('click', hideOrderForm);
  document.getElementById('addOrderBtn').addEventListener('click', () => showOrderForm());

  document.getElementById('orderTotalAmount').addEventListener('input', calculateAmounts);
  document.getElementById('orderAdvancePercentage').addEventListener('input', calculateAmounts);

  // Date validation - set min dates for ETA and Final Delivery
  document.getElementById('orderDate').addEventListener('change', function () {
    const orderDate = this.value;
    if (orderDate) {
      document.getElementById('orderETA').min = orderDate;
      document.getElementById('orderFinalDeliveryDate').min = orderDate;
    }
  });

  // Multi-color checkbox handling
  const colorCheckboxes = document.querySelectorAll('.color-check');
  const colorDropdownBtn = document.getElementById('colorDropdownBtn');
  const colorHiddenInput = document.getElementById('orderFilamentColor');

  function updateSelectedColors() {
    const selectedColors = [];
    colorCheckboxes.forEach(cb => {
      if (cb.checked) selectedColors.push(cb.value);
    });

    if (selectedColors.length === 0) {
      colorDropdownBtn.textContent = 'Select Colors';
    } else if (selectedColors.length <= 3) {
      colorDropdownBtn.textContent = selectedColors.join(', ');
    } else {
      colorDropdownBtn.textContent = `${selectedColors.length} colors selected`;
    }

    colorHiddenInput.value = selectedColors.join(', ');
  }

  colorCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateSelectedColors);
  });
});

window.editOrder = editOrder;

// Download invoice PDF for an order
function downloadInvoice(orderId) {
  window.open(`/api/invoice/${orderId}/pdf`, '_blank');
}

window.downloadInvoice = downloadInvoice;
