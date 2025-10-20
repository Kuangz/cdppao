const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT and attach user with populated role
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided or malformed token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Fetch user and populate the role information
        const user = await User.findById(decoded.userId).populate({
            path: 'role',
            populate: {
                path: 'permissions.layer',
                select: 'name'
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware factory for checking permissions
const hasPermission = (action, resourceType) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Forbidden: No role assigned' });
        }

        // Admin has all permissions
        if (req.user.role.name === 'admin') {
            return next();
        }

        let resourceId;
        if (resourceType === 'Layer') {
            // In routes like /api/layers/:id or /api/layers/:layerId/...
            resourceId = req.params.id || req.params.layerId;
        }
        // Can be extended for other resource types like 'GeoObject'

        if (!resourceId) {
            // If no specific resource, this might be a general action (e.g., creating a new layer)
            // For now, we'll deny if no resource ID is found, but this could be adapted.
            return res.status(400).json({ error: 'Resource ID not specified' });
        }

        const permission = req.user.role.permissions.find(p => p.layer._id.toString() === resourceId);

        if (permission && permission.actions.includes(action)) {
            return next();
        }

        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    };
};

module.exports = { authenticate, hasPermission };
