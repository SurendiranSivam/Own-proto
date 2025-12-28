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
      { field: 'id', label: 'ID', render: (val) => `#${val}` },
      { field: 'customer_name', label: 'Customer' },
      { field: 'contact_number', label: 'Contact' },
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
      }
    ],
    filters: [
      { field: 'customer_name', label: 'Customer', type: 'text', placeholder: 'Search...' },
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

  const orderData = {
    customer_name: document.getElementById('orderCustomerName').value.trim(),
    customer_email: document.getElementById('orderCustomerEmail').value.trim(),
    contact_number: document.getElementById('orderContact').value.trim(),
    delivery_address: document.getElementById('orderDeliveryAddress').value.trim(),
    order_description: document.getElementById('orderDescription').value.trim(),
    print_type: document.getElementById('orderPrintType').value.trim(),
    filament_type: document.getElementById('orderFilamentType').value.trim(),
    filament_color: document.getElementById('orderFilamentColor').value.trim(),
    priority: document.getElementById('orderPriority').value,
    estimated_quantity_units: document.getElementById('orderQuantity').value,
    estimated_filament_usage_kg: document.getElementById('orderFilamentUsage').value,
    order_date: document.getElementById('orderDate').value,
    eta_delivery: document.getElementById('orderETA').value || null,
    final_delivery_date: document.getElementById('orderFinalDeliveryDate').value || null,
    total_amount: parseFloat(document.getElementById('orderTotalAmount').value),
    advance_percentage: parseFloat(document.getElementById('orderAdvancePercentage').value) || 0,
    discount_percentage: parseFloat(document.getElementById('orderDiscountPercentage').value) || 0,
    gst_percentage: parseFloat(document.getElementById('orderGSTPercentage').value) || 0,
    status: document.getElementById('orderStatus').value,
    notes: document.getElementById('orderNotes').value.trim()
  };

  if (!orderData.customer_name || !orderData.order_date || !orderData.total_amount) {
    window.api.showNotification('Customer name, order date, and total amount are required', 'error');
    return;
  }

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
});

window.editOrder = editOrder;
