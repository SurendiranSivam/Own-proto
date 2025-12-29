let vendors = [];
let editingId = null;
let tableManager = null;

async function loadVendors() {
  try {
    vendors = await window.api.get('/vendors');
    if (tableManager) {
      tableManager.setData(vendors);
    }
  } catch (error) {
    window.api.showNotification('Failed to load vendors: ' + error.message, 'error');
  }
}

function initTable() {
  tableManager = new TableManager({
    containerId: 'vendorsTable',
    pageSize: 10,
    exportFilename: 'vendors',
    columns: [
      { field: 'name', label: 'Name' },
      { field: 'email', label: 'Email' },
      { field: 'contact', label: 'Contact' },
      { field: 'state', label: 'State' },
      { field: 'pincode', label: 'Pincode' },
      { field: 'payment_terms', label: 'Payment Terms', render: (val) => val ? val.toUpperCase() : '-' },
      { field: 'is_active', label: 'Status', render: (val) => val ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>' }
    ],
    filters: [
      { field: 'name', label: 'Name', type: 'text', placeholder: 'Search name...' },
      { field: 'state', label: 'State', type: 'text', placeholder: 'Search state...' },
      {
        field: 'payment_terms', label: 'Payment Terms', type: 'select', options: [
          { value: 'advance', label: 'Advance' },
          { value: 'cod', label: 'COD' },
          { value: 'net15', label: 'Net 15' },
          { value: 'net30', label: 'Net 30' },
          { value: 'net60', label: 'Net 60' }
        ]
      }
    ],
    onEdit: editVendor,
    onDelete: deleteVendor
  });
}

function showVendorForm(vendor = null) {
  editingId = vendor ? vendor.id : null;
  document.getElementById('vendorName').value = vendor ? vendor.name : '';
  document.getElementById('vendorEmail').value = vendor ? vendor.email || '' : '';
  document.getElementById('vendorContact').value = vendor ? vendor.contact || '' : '';
  document.getElementById('vendorAddress').value = vendor ? vendor.address || '' : '';
  document.getElementById('vendorState').value = vendor ? vendor.state || '' : '';
  document.getElementById('vendorPincode').value = vendor ? vendor.pincode || '' : '';
  document.getElementById('vendorGST').value = vendor ? vendor.gst || '' : '';
  document.getElementById('vendorPaymentTerms').value = vendor ? vendor.payment_terms || 'advance' : 'advance';
  document.getElementById('vendorNotes').value = vendor ? vendor.notes || '' : '';

  document.getElementById('vendorFormTitle').textContent = vendor ? 'Edit Vendor' : 'Add New Vendor';
  document.getElementById('vendorForm').classList.remove('d-none');
}

function hideVendorForm() {
  document.getElementById('vendorForm').classList.add('d-none');
  document.getElementById('vendorFormElement').reset();
  editingId = null;
}

async function saveVendor(e) {
  e.preventDefault();

  // Clear previous validation errors
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

  const vendorData = {
    name: document.getElementById('vendorName').value.trim(),
    email: document.getElementById('vendorEmail').value.trim(),
    contact: document.getElementById('vendorContact').value.trim(),
    address: document.getElementById('vendorAddress').value.trim(),
    state: document.getElementById('vendorState').value.trim(),
    pincode: document.getElementById('vendorPincode').value.trim(),
    gst: document.getElementById('vendorGST').value.trim(),
    payment_terms: document.getElementById('vendorPaymentTerms').value,
    notes: document.getElementById('vendorNotes').value.trim()
  };

  const errors = [];

  // Validate name
  if (!vendorData.name) {
    errors.push('Vendor name is required');
    document.getElementById('vendorName').classList.add('is-invalid');
  }

  // Validate contact (10 digits, numbers only)
  if (vendorData.contact) {
    if (!/^\d{10}$/.test(vendorData.contact)) {
      errors.push('Contact must be exactly 10 digits (numbers only)');
      document.getElementById('vendorContact').classList.add('is-invalid');
    }
  }

  // Validate pincode (6 digits, numbers only)
  if (vendorData.pincode) {
    if (!/^\d{6}$/.test(vendorData.pincode)) {
      errors.push('Pincode must be exactly 6 digits (numbers only)');
      document.getElementById('vendorPincode').classList.add('is-invalid');
    }
  }

  // Validate email format
  if (vendorData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorData.email)) {
    errors.push('Invalid email format');
    document.getElementById('vendorEmail').classList.add('is-invalid');
  }

  if (errors.length > 0) {
    window.api.showNotification(errors.join('. '), 'error');
    return;
  }

  try {
    if (editingId) {
      await window.api.put(`/vendors/${editingId}`, vendorData);
      window.api.showNotification('Vendor updated successfully', 'success');
    } else {
      await window.api.post('/vendors', vendorData);
      window.api.showNotification('Vendor created successfully', 'success');
    }

    hideVendorForm();
    loadVendors();
  } catch (error) {
    window.api.showNotification('Failed to save vendor: ' + error.message, 'error');
  }
}

function editVendor(id) {
  const vendor = vendors.find(v => v.id === id);
  if (vendor) {
    showVendorForm(vendor);
  }
}

async function deleteVendor(id) {
  if (!confirm('Are you sure you want to delete this vendor?')) {
    return;
  }

  try {
    await window.api.del(`/vendors/${id}`);
    window.api.showNotification('Vendor deleted successfully', 'success');
    loadVendors();
  } catch (error) {
    window.api.showNotification('Failed to delete vendor: ' + error.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTable();
  loadVendors();
  document.getElementById('vendorFormElement').addEventListener('submit', saveVendor);
  document.getElementById('cancelVendorBtn').addEventListener('click', hideVendorForm);
  document.getElementById('addVendorBtn').addEventListener('click', () => showVendorForm());
});

window.editVendor = editVendor;
window.deleteVendor = deleteVendor;
