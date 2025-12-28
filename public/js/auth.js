/**
 * Frontend Authentication Utilities
 * Enhanced with proper role-based access control
 */

const AUTH_TOKEN_KEY = 'ownproto_token';
const AUTH_USER_KEY = 'ownproto_user';

const auth = {
    // Get stored token
    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    // Get stored user
    getUser() {
        const user = localStorage.getItem(AUTH_USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    // Check if logged in
    isLoggedIn() {
        return !!this.getToken();
    },

    // Get user role
    getRole() {
        const user = this.getUser();
        return user ? user.role : null;
    },

    // Get user initials for avatar
    getInitials() {
        const user = this.getUser();
        if (!user || !user.name) return 'U';
        return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    },

    // Check role permissions
    canEdit() {
        const role = this.getRole();
        return role === 'super_admin' || role === 'manager';
    },

    canDelete() {
        return this.getRole() === 'super_admin';
    },

    isSuperAdmin() {
        return this.getRole() === 'super_admin';
    },

    isManager() {
        return this.getRole() === 'manager';
    },

    isExecutive() {
        return this.getRole() === 'executive';
    },

    // Login
    async login(email, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store token and user
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

        return data;
    },

    // Logout
    logout() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        window.location.href = '/login.html';
    },

    // Forgot password
    async forgotPassword(email) {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    },

    // Reset password
    async resetPassword(token, newPassword) {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Reset failed');
        }

        return data;
    },

    // Change password
    async changePassword(currentPassword, newPassword) {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to change password');
        }

        return data;
    },

    // Require authentication - redirect to login if not authenticated
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    // Add auth header to fetch options
    authHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    // Setup page based on role - ENHANCED VERSION
    setupPageForRole() {
        const user = this.getUser();
        if (!user) return;

        const role = user.role;

        // Add role class to body for CSS-based access control
        document.body.classList.remove('role-super_admin', 'role-manager', 'role-executive');
        document.body.classList.add(`role-${role}`);

        // Update user display in navbar
        const userNameEl = document.getElementById('currentUserName');
        const userRoleEl = document.getElementById('currentUserRole');
        const userAvatarEl = document.getElementById('userAvatar');

        if (userNameEl) userNameEl.textContent = user.name;
        if (userRoleEl) {
            const roleLabels = { super_admin: 'Super Admin', manager: 'Manager', executive: 'Executive' };
            userRoleEl.textContent = roleLabels[role] || role;
            userRoleEl.className = `role-badge role-${role}`;
        }
        if (userAvatarEl) {
            userAvatarEl.textContent = this.getInitials();
        }

        // Show users nav link for super admin
        const usersLink = document.getElementById('usersNavLink');
        if (usersLink) {
            usersLink.style.display = this.isSuperAdmin() ? 'block' : 'none';
        }

        // Show profile link for super admin
        const profileLink = document.getElementById('profileNavLink');
        if (profileLink) {
            profileLink.style.display = this.isSuperAdmin() ? 'block' : 'none';
        }

        // Apply role-based visibility using JavaScript as backup
        this.applyAccessControl();
    },

    // Apply access control to elements
    applyAccessControl() {
        const role = this.getRole();

        // Hide delete buttons for non-super-admin
        if (role !== 'super_admin') {
            document.querySelectorAll('.btn-delete, [data-action="delete"], .delete-only').forEach(el => {
                el.style.display = 'none';
            });
        }

        // Hide edit buttons and add buttons for executives
        if (role === 'executive') {
            document.querySelectorAll('.btn-edit, [data-action="edit"], .edit-only').forEach(el => {
                el.style.display = 'none';
            });

            // Hide all add buttons
            const addButtons = document.querySelectorAll(
                '#addVendorBtn, #addOrderBtn, #addFilamentBtn, #addProcurementBtn, #addPaymentBtn, #addUsageBtn, #addUserBtn'
            );
            addButtons.forEach(el => {
                el.style.display = 'none';
            });

            // Hide forms
            document.querySelectorAll('.card form').forEach(form => {
                const card = form.closest('.card');
                if (card && !card.classList.contains('always-show')) {
                    // Keep form hidden
                }
            });
        }

        // Show admin-only elements
        if (role === 'super_admin') {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'block';
            });
        }
    },

    // Re-apply access control after dynamic content loads
    refreshAccessControl() {
        setTimeout(() => this.applyAccessControl(), 100);
    }
};

// Export for use
window.auth = auth;

// Auto-apply access control when DOM changes (for dynamic content)
if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
        // Check if new nodes were added
        const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
        if (hasNewNodes && auth.isLoggedIn()) {
            auth.refreshAccessControl();
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    });
}
