/**
 * Table Utilities - Filters, Pagination, Selection, Export
 * Shared module for all data tables
 */

class TableManager {
    constructor(config) {
        this.containerId = config.containerId;
        this.data = [];
        this.filteredData = [];
        this.selectedIds = new Set();
        this.currentPage = 1;
        this.pageSize = config.pageSize || 10;
        this.columns = config.columns || [];
        this.filters = config.filters || [];
        this.exportFilename = config.exportFilename || 'export';
        this.onEdit = config.onEdit || null;
        this.onDelete = config.onDelete || null;
        this.renderRow = config.renderRow || null;

        this.init();
    }

    init() {
        this.renderControls();
        this.attachEventListeners();
    }

    renderControls() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Create filter and control bar
        const controlsHtml = `
      <div class="table-controls mb-3">
        <div class="row g-2 align-items-end">
          ${this.renderFilterInputs()}
          <div class="col-auto">
            <button class="btn btn-outline-secondary btn-sm" id="${this.containerId}-clearFilters">
              Clear Filters
            </button>
          </div>
          <div class="col-auto ms-auto">
            <div class="btn-group">
              <button class="btn btn-success btn-sm" id="${this.containerId}-exportAll">
                📥 Export All
              </button>
              <button class="btn btn-outline-success btn-sm" id="${this.containerId}-exportSelected" disabled>
                📥 Export Selected (<span id="${this.containerId}-selectedCount">0</span>)
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th style="width: 40px;">
                <input type="checkbox" class="form-check-input" id="${this.containerId}-selectAll">
              </th>
              ${this.columns.map(col => `<th>${col.label}</th>`).join('')}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="${this.containerId}-tbody">
            <tr><td colspan="${this.columns.length + 2}" class="text-center">Loading...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div class="text-muted">
          Showing <span id="${this.containerId}-showingStart">0</span>-<span id="${this.containerId}-showingEnd">0</span> 
          of <span id="${this.containerId}-totalCount">0</span> records
        </div>
        <div class="d-flex align-items-center gap-2">
          <select class="form-select form-select-sm" style="width: auto;" id="${this.containerId}-pageSize">
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
          <nav>
            <ul class="pagination pagination-sm mb-0" id="${this.containerId}-pagination"></ul>
          </nav>
        </div>
      </div>
    `;

        container.innerHTML = controlsHtml;
    }

    renderFilterInputs() {
        return this.filters.map(filter => {
            if (filter.type === 'select') {
                return `
          <div class="col-auto">
            <label class="form-label small mb-1">${filter.label}</label>
            <select class="form-select form-select-sm" id="${this.containerId}-filter-${filter.field}">
              <option value="">All</option>
              ${(filter.options || []).map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
            </select>
          </div>
        `;
            } else if (filter.type === 'date') {
                return `
          <div class="col-auto">
            <label class="form-label small mb-1">${filter.label}</label>
            <input type="date" class="form-control form-control-sm" id="${this.containerId}-filter-${filter.field}">
          </div>
        `;
            } else {
                return `
          <div class="col-auto">
            <label class="form-label small mb-1">${filter.label}</label>
            <input type="text" class="form-control form-control-sm" id="${this.containerId}-filter-${filter.field}" 
                   placeholder="${filter.placeholder || 'Search...'}">
          </div>
        `;
            }
        }).join('');
    }

    attachEventListeners() {
        // Filter inputs
        this.filters.forEach(filter => {
            const input = document.getElementById(`${this.containerId}-filter-${filter.field}`);
            if (input) {
                input.addEventListener('input', () => this.applyFilters());
                input.addEventListener('change', () => this.applyFilters());
            }
        });

        // Clear filters
        document.getElementById(`${this.containerId}-clearFilters`)?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Select all
        document.getElementById(`${this.containerId}-selectAll`)?.addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Page size
        document.getElementById(`${this.containerId}-pageSize`)?.addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.render();
        });

        // Export buttons
        document.getElementById(`${this.containerId}-exportAll`)?.addEventListener('click', () => {
            this.exportToCSV(this.filteredData);
        });

        document.getElementById(`${this.containerId}-exportSelected`)?.addEventListener('click', () => {
            const selectedData = this.filteredData.filter(item => this.selectedIds.has(item.id));
            this.exportToCSV(selectedData);
        });
    }

    setData(data) {
        this.data = data || [];
        this.applyFilters();
    }

    applyFilters() {
        this.filteredData = [...this.data];

        this.filters.forEach(filter => {
            const input = document.getElementById(`${this.containerId}-filter-${filter.field}`);
            if (!input) return;

            const value = input.value.trim().toLowerCase();
            if (!value) return;

            this.filteredData = this.filteredData.filter(item => {
                const fieldValue = String(item[filter.field] || '').toLowerCase();

                if (filter.type === 'select') {
                    return fieldValue === value;
                } else if (filter.type === 'date') {
                    return fieldValue.startsWith(value);
                } else {
                    return fieldValue.includes(value);
                }
            });
        });

        this.currentPage = 1;
        this.selectedIds.clear();
        this.render();
    }

    clearFilters() {
        this.filters.forEach(filter => {
            const input = document.getElementById(`${this.containerId}-filter-${filter.field}`);
            if (input) input.value = '';
        });
        this.applyFilters();
    }

    render() {
        const tbody = document.getElementById(`${this.containerId}-tbody`);
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${this.columns.length + 2}" class="text-center">No records found</td></tr>`;
        } else {
            tbody.innerHTML = pageData.map(item => this.renderTableRow(item)).join('');
        }

        this.updatePagination();
        this.updateSelectedCount();
        this.attachRowEventListeners();
    }

    renderTableRow(item) {
        const isSelected = this.selectedIds.has(item.id);
        const cells = this.columns.map(col => {
            let value = item[col.field];
            if (col.render) {
                value = col.render(value, item);
            } else if (value === null || value === undefined) {
                value = '-';
            }
            return `<td>${value}</td>`;
        }).join('');

        return `
      <tr data-id="${item.id}" class="${isSelected ? 'table-primary' : ''}">
        <td>
          <input type="checkbox" class="form-check-input row-select" data-id="${item.id}" ${isSelected ? 'checked' : ''}>
        </td>
        ${cells}
        <td>
          <div class="btn-group btn-group-sm">
            ${this.onEdit ? `<button class="btn btn-primary btn-edit" data-id="${item.id}">Edit</button>` : ''}
            ${this.onDelete ? `<button class="btn btn-danger btn-delete" data-id="${item.id}">Delete</button>` : ''}
          </div>
        </td>
      </tr>
    `;
    }

    attachRowEventListeners() {
        // Row checkboxes
        document.querySelectorAll(`#${this.containerId}-tbody .row-select`).forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    this.selectedIds.add(id);
                } else {
                    this.selectedIds.delete(id);
                }
                this.updateSelectedCount();
                this.updateRowHighlight(id, e.target.checked);
            });
        });

        // Edit buttons
        document.querySelectorAll(`#${this.containerId}-tbody .btn-edit`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (this.onEdit) this.onEdit(id);
            });
        });

        // Delete buttons
        document.querySelectorAll(`#${this.containerId}-tbody .btn-delete`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (this.onDelete) this.onDelete(id);
            });
        });
    }

    updateRowHighlight(id, selected) {
        const row = document.querySelector(`#${this.containerId}-tbody tr[data-id="${id}"]`);
        if (row) {
            row.classList.toggle('table-primary', selected);
        }
    }

    toggleSelectAll(checked) {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        pageData.forEach(item => {
            if (checked) {
                this.selectedIds.add(item.id);
            } else {
                this.selectedIds.delete(item.id);
            }
        });

        document.querySelectorAll(`#${this.containerId}-tbody .row-select`).forEach(checkbox => {
            checkbox.checked = checked;
            const id = parseInt(checkbox.dataset.id);
            this.updateRowHighlight(id, checked);
        });

        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const countEl = document.getElementById(`${this.containerId}-selectedCount`);
        const exportBtn = document.getElementById(`${this.containerId}-exportSelected`);

        if (countEl) countEl.textContent = this.selectedIds.size;
        if (exportBtn) exportBtn.disabled = this.selectedIds.size === 0;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        const pagination = document.getElementById(`${this.containerId}-pagination`);

        if (!pagination) return;

        let html = '';

        // Previous button
        html += `
      <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${this.currentPage - 1}">«</a>
      </li>
    `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            html += `
        <li class="page-item ${i === this.currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
        }

        // Next button
        html += `
      <li class="page-item ${this.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${this.currentPage + 1}">»</a>
      </li>
    `;

        pagination.innerHTML = html;

        // Attach pagination click handlers
        pagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.render();
                }
            });
        });

        // Update showing info
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.filteredData.length);

        document.getElementById(`${this.containerId}-showingStart`).textContent =
            this.filteredData.length > 0 ? startIndex + 1 : 0;
        document.getElementById(`${this.containerId}-showingEnd`).textContent = endIndex;
        document.getElementById(`${this.containerId}-totalCount`).textContent = this.filteredData.length;
    }

    exportToCSV(data) {
        if (!data || data.length === 0) {
            alert('No data to export');
            return;
        }

        // Build CSV header
        const headers = this.columns.map(col => col.label);
        let csv = headers.join(',') + '\n';

        // Build CSV rows
        data.forEach(item => {
            const row = this.columns.map(col => {
                let value = item[col.field];
                if (value === null || value === undefined) value = '';
                // Escape quotes and wrap in quotes
                value = String(value).replace(/"/g, '""');
                return `"${value}"`;
            });
            csv += row.join(',') + '\n';
        });

        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${this.exportFilename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

// Export for use
window.TableManager = TableManager;
