let filaments = [];
let vendors = [];
let editingId = null;
let tableManager = null;

async function loadData() {
  try {
    [filaments, vendors] = await Promise.all([
      window.api.get('/inventory'),
      window.api.get('/vendors')
    ]);

    populateVendorDropdown();
    if (tableManager) {
      tableManager.setData(filaments);
    }
    checkLowStock();
  } catch (error) {
    window.api.showNotification('Failed to load data: ' + error.message, 'error');
  }
}

function populateVendorDropdown() {
  const select = document.getElementById('filamentVendor');
  select.innerHTML = '<option value="">Select Vendor</option>';
  vendors.forEach(v => {
    select.innerHTML += `<option value="${v.id}">${v.name}</option>`;
  });
}

function checkLowStock() {
  const lowStock = filaments.filter(f => (f.current_stock_kg || 0) <= (f.min_stock_alert_kg || 1));
  const alertEl = document.getElementById('lowStockAlert');
  const msgEl = document.getElementById('lowStockMessage');

  if (lowStock.length > 0) {
    msgEl.textContent = `${lowStock.length} filament(s) are running low!`;
    alertEl.classList.remove('d-none');
  } else {
    alertEl.classList.add('d-none');
  }
}

function initTable() {
  tableManager = new TableManager({
    containerId: 'inventoryTable',
    pageSize: 10,
    exportFilename: 'inventory',
    columns: [
      { field: 'type', label: 'Type' },
      { field: 'brand', label: 'Brand' },
      { field: 'color', label: 'Color' },
      { field: 'diameter', label: 'Diameter' },
      {
        field: 'current_stock_kg', label: 'Stock (kg)', render: (val, item) => {
          const stock = val || 0;
          const min = item.min_stock_alert_kg || 1;
          const cls = stock <= min ? 'text-danger fw-bold' : 'text-success';
          return `<span class="${cls}">${stock.toFixed(2)}</span>`;
        }
      },
      { field: 'cost_per_kg', label: 'Cost/kg', render: (val) => window.api.formatCurrency(val) },
      { field: 'vendor_name', label: 'Vendor' },
      { field: 'quality_grade', label: 'Grade', render: (val) => (val || 'standard').toUpperCase() },
      {
        field: 'is_active', label: 'Status', render: (val) => val !== false ?
          '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>'
      }
    ],
    filters: [
      {
        field: 'type', label: 'Type', type: 'select', options: [
          { value: 'pla', label: 'PLA' },
          { value: 'abs', label: 'ABS' },
          { value: 'petg', label: 'PETG' },
          { value: 'tpu', label: 'TPU' },
          { value: 'asa', label: 'ASA' },
          { value: 'nylon', label: 'Nylon' }
        ]
      },
      { field: 'brand', label: 'Brand', type: 'text', placeholder: 'Search...' },
      { field: 'color', label: 'Color', type: 'text', placeholder: 'Search...' }
    ],
    onEdit: editFilament,
    onDelete: deleteFilament
  });
}

function showFilamentForm(filament = null) {
  editingId = filament ? filament.id : null;
  document.getElementById('filamentType').value = filament ? filament.type : '';
  document.getElementById('filamentBrand').value = filament ? filament.brand : '';
  document.getElementById('filamentColor').value = filament ? filament.color : '';
  document.getElementById('filamentDiameter').value = filament ? filament.diameter || '1.75mm' : '1.75mm';
  document.getElementById('filamentWeight').value = filament ? filament.weight_per_spool_kg || 1 : 1;
  document.getElementById('filamentCost').value = filament ? filament.cost_per_kg : '';
  document.getElementById('filamentMinStock').value = filament ? filament.min_stock_alert_kg || 1 : 1;
  document.getElementById('filamentVendor').value = filament ? filament.vendor_id || '' : '';
  document.getElementById('filamentPrintTempMin').value = filament ? filament.print_temp_min || '' : '';
  document.getElementById('filamentPrintTempMax').value = filament ? filament.print_temp_max || '' : '';
  document.getElementById('filamentBedTemp').value = filament ? filament.bed_temp || '' : '';
  document.getElementById('filamentQualityGrade').value = filament ? filament.quality_grade || 'standard' : 'standard';

  document.getElementById('filamentFormTitle').textContent = filament ? 'Edit Filament' : 'Add New Filament';
  document.getElementById('filamentForm').classList.remove('d-none');
}

function hideFilamentForm() {
  document.getElementById('filamentForm').classList.add('d-none');
  document.getElementById('filamentFormElement').reset();
  editingId = null;
}

async function saveFilament(e) {
  e.preventDefault();

  const filamentData = {
    type: document.getElementById('filamentType').value,
    brand: document.getElementById('filamentBrand').value.trim(),
    color: document.getElementById('filamentColor').value.trim(),
    diameter: document.getElementById('filamentDiameter').value,
    weight_per_spool_kg: document.getElementById('filamentWeight').value,
    cost_per_kg: document.getElementById('filamentCost').value,
    min_stock_alert_kg: document.getElementById('filamentMinStock').value,
    vendor_id: document.getElementById('filamentVendor').value || null,
    print_temp_min: document.getElementById('filamentPrintTempMin').value || null,
    print_temp_max: document.getElementById('filamentPrintTempMax').value || null,
    bed_temp: document.getElementById('filamentBedTemp').value || null,
    quality_grade: document.getElementById('filamentQualityGrade').value
  };

  if (!filamentData.type || !filamentData.brand || !filamentData.color || !filamentData.cost_per_kg) {
    window.api.showNotification('Type, brand, color, and cost are required', 'error');
    return;
  }

  try {
    if (editingId) {
      await window.api.put(`/inventory/${editingId}`, filamentData);
      window.api.showNotification('Filament updated successfully', 'success');
    } else {
      await window.api.post('/inventory', filamentData);
      window.api.showNotification('Filament created successfully', 'success');
    }

    hideFilamentForm();
    loadData();
  } catch (error) {
    window.api.showNotification('Failed to save filament: ' + error.message, 'error');
  }
}

function editFilament(id) {
  const filament = filaments.find(f => f.id === id);
  if (filament) {
    showFilamentForm(filament);
  }
}

async function deleteFilament(id) {
  if (!confirm('Are you sure you want to delete this filament?')) {
    return;
  }

  try {
    await window.api.del(`/inventory/${id}`);
    window.api.showNotification('Filament deleted successfully', 'success');
    loadData();
  } catch (error) {
    window.api.showNotification('Failed to delete filament: ' + error.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTable();
  loadData();
  document.getElementById('filamentFormElement').addEventListener('submit', saveFilament);
  document.getElementById('cancelFilamentBtn').addEventListener('click', hideFilamentForm);
  document.getElementById('addFilamentBtn').addEventListener('click', () => showFilamentForm());
});

window.editFilament = editFilament;
window.deleteFilament = deleteFilament;
