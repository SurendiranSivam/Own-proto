/**
 * Authentication Routes
 * Login, logout, password reset
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const userModel = require('../models/user');
const { generateToken, verifyToken, requireRole } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get user by email
        const user = await userModel.getByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({ error: 'Account is deactivated. Contact admin.' });
        }

        // Verify password
        const isValidPassword = await userModel.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        await userModel.updateLastLogin(user.id);

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await userModel.getById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await userModel.getByEmail(email);
        if (!user) {
            // Don't reveal if email exists
            return res.json({ success: true, message: 'If the email exists, a reset link will be sent' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        await userModel.setResetToken(email, resetToken, expires);

        // In production, send email with reset link
        // For now, just return the token (development only)
        res.json({
            success: true,
            message: 'Password reset token generated',
            // Remove this in production!
            resetToken: resetToken,
            resetUrl: `/reset-password.html?token=${resetToken}`
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await userModel.getByResetToken(token);
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        await userModel.resetPassword(user.id, newPassword);

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Change password (logged in user)
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        const user = await userModel.getByEmail(req.user.email);
        const isValidPassword = await userModel.verifyPassword(currentPassword, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        await userModel.resetPassword(user.id, newPassword);

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// ==========================================
// USER MANAGEMENT (Super Admin only)
// ==========================================

// Get all users
router.get('/users', verifyToken, requireRole('super_admin'), async (req, res) => {
    try {
        const users = await userModel.getAll();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create user
router.post('/users', verifyToken, requireRole('super_admin'), async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const existingUser = await userModel.getByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const user = await userModel.create({ email, password, name, role });
        res.status(201).json(user);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
router.put('/users/:id', verifyToken, requireRole('super_admin'), async (req, res) => {
    try {
        const user = await userModel.update(req.params.id, req.body);
        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/users/:id', verifyToken, requireRole('super_admin'), async (req, res) => {
    try {
        // Prevent self-deletion
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await userModel.remove(req.params.id);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
