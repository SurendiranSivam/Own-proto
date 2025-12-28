let payments = [];
let orders = [];
let tableManager = null;

async function loadData() {
  try {
    [payments, orders] = await Promise.all([
      window.api.get('/payments'),
      window.api.get('/orders')
    ]);

    populateOrderDropdown();
    if (tableManager) {
      tableManager.setData(payments);
    }
  } catch (error) {
    window.api.showNotification('Failed to load data: ' + error.message, 'error');
  }
}

function populateOrderDropdown() {
  const select = document.getElementById('paymentOrder');
  select.innerHTML = '<option value="">Select Order</option>';
  orders.forEach(o => {
    select.innerHTML += `<option value="${o.id}">#${o.id} - ${o.customer_name} (Balance: ${window.api.formatCurrency(o.balance_amount || 0)})</option>`;
  });
}

function initTable() {
  tableManager = new TableManager({
    containerId: 'paymentsTable',
    pageSize: 10,
    exportFilename: 'payments',
    columns: [
      { field: 'id', label: 'ID', render: (val) => `#${val}` },
      { field: 'order_id', label: 'Order', render: (val) => `#${val}` },
      { field: 'customer_name', label: 'Customer' },
      { field: 'amount', label: 'Amount', render: (val) => window.api.formatCurrency(val) },
      {
        field: 'payment_type', label: 'Type', render: (val) => {
          const colors = { advance: 'info', balance: 'success', refund: 'warning' };
          return `<span class="badge bg-${colors[val] || 'secondary'}">${(val || '').toUpperCase()}</span>`;
        }
      },
      { field: 'payment_method', label: 'Method', render: (val) => (val || 'cash').replace('_', ' ').toUpperCase() },
      { field: 'payment_date', label: 'Date', render: (val) => window.api.formatDate(val) },
      { field: 'transaction_ref', label: 'Txn Ref' }
    ],
    filters: [
      { field: 'customer_name', label: 'Customer', type: 'text', placeholder: 'Search...' },
      {
        field: 'payment_type', label: 'Type', type: 'select', options: [
          { value: 'advance', label: 'Advance' },
          { value: 'balance', label: 'Balance' },
          { value: 'refund', label: 'Refund' }
        ]
      },
      {
        field: 'payment_method', label: 'Method', type: 'select', options: [
          { value: 'cash', label: 'Cash' },
          { value: 'upi', label: 'UPI' },
          { value: 'bank_transfer', label: 'Bank Transfer' },
          { value: 'card', label: 'Card' },
          { value: 'cheque', label: 'Cheque' }
        ]
      }
    ],
    onEdit: null,
    onDelete: deletePayment
  });
}

function showPaymentForm() {
  document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('paymentForm').classList.remove('d-none');
}

function hidePaymentForm() {
  document.getElementById('paymentForm').classList.add('d-none');
  document.getElementById('paymentFormElement').reset();
}

async function savePayment(e) {
  e.preventDefault();

  const paymentData = {
    order_id: document.getElementById('paymentOrder').value,
    amount: document.getElementById('paymentAmount').value,
    payment_type: document.getElementById('paymentType').value,
    payment_method: document.getElementById('paymentMethod').value,
    payment_date: document.getElementById('paymentDate').value,
    transaction_ref: document.getElementById('paymentTransactionRef').value.trim(),
    notes: document.getElementById('paymentNotes').value.trim()
  };

  if (!paymentData.order_id || !paymentData.amount || !paymentData.payment_date) {
    window.api.showNotification('Order, amount, and date are required', 'error');
    return;
  }

  try {
    await window.api.post('/payments', paymentData);
    window.api.showNotification('Payment recorded successfully', 'success');
    hidePaymentForm();
    loadData();
  } catch (error) {
    window.api.showNotification('Failed to save payment: ' + error.message, 'error');
  }
}

async function deletePayment(id) {
  if (!confirm('Are you sure you want to delete this payment?')) {
    return;
  }

  try {
    await window.api.del(`/payments/${id}`);
    window.api.showNotification('Payment deleted successfully', 'success');
    loadData();
  } catch (error) {
    window.api.showNotification('Failed to delete payment: ' + error.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTable();
  loadData();
  document.getElementById('paymentFormElement').addEventListener('submit', savePayment);
  document.getElementById('cancelPaymentBtn').addEventListener('click', hidePaymentForm);
  document.getElementById('addPaymentBtn').addEventListener('click', showPaymentForm);
});

window.deletePayment = deletePayment;
