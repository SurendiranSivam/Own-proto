// API client helper functions

const API_BASE = '/api';

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

function get(endpoint) {
  return apiCall(endpoint, { method: 'GET' });
}

function post(endpoint, data) {
  return apiCall(endpoint, {
    method: 'POST',
    body: data,
  });
}

function put(endpoint, data) {
  return apiCall(endpoint, {
    method: 'PUT',
    body: data,
  });
}

function del(endpoint) {
  return apiCall(endpoint, { method: 'DELETE' });
}

function formatCurrency(amount) {
  return `₹${parseFloat(amount).toFixed(2)}`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function showNotification(message, type = 'info') {
  const existing = document.querySelector('.toast-notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = `toast-notification alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 300px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

if (!document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

// Make functions available globally
window.api = {
  get,
  post,
  put,
  del,
  formatCurrency,
  formatDate,
  showNotification
};

