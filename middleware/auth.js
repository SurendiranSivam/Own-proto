/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ownproto-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Role hierarchy
const ROLES = {
    super_admin: 3,
    manager: 2,
    executive: 1
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Optional auth - doesn't fail if no token, just sets req.user if valid
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token invalid, but continue without user
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
};

// Role-based access control
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access denied. Insufficient permissions.',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
};

// Require minimum role level
const requireMinRole = (minRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userLevel = ROLES[req.user.role] || 0;
        const requiredLevel = ROLES[minRole] || 0;

        if (userLevel < requiredLevel) {
            return res.status(403).json({
                error: 'Access denied. Insufficient permissions.',
                required: minRole,
                current: req.user.role
            });
        }

        next();
    };
};

// Check if user can edit (manager or above)
const canEdit = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!['super_admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Edit access denied' });
    }

    next();
};

// Check if user can delete (super_admin only)
const canDelete = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Delete access denied' });
    }

    next();
};

module.exports = {
    generateToken,
    verifyToken,
    optionalAuth,
    requireRole,
    requireMinRole,
    canEdit,
    canDelete,
    JWT_SECRET,
    ROLES
};
