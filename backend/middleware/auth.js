// middleware/auth.js
'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// read token from Authorization: Bearer or cookie
const getTokenFromRequest = (req) => {
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7);
    if (req.cookies && req.cookies.accessToken) return req.cookies.accessToken;
    return null;
};

const jwtVerifyOpts = {
    algorithms: ['HS256'],
    clockTolerance: 5,
};

// build quick index for permissions
const buildPermissionIndex = (role) => {
    const byLayerId = new Map();
    const allowedLayerIds = [];
    for (const p of role?.permissions || []) {
        const layerId =
            p?.layer && typeof p.layer === 'object'
                ? String(p.layer._id || p.layer.id)
                : p?.layer
                    ? String(p.layer)
                    : null;
        if (!layerId) continue;
        byLayerId.set(layerId, new Set(p.actions || []));
        allowedLayerIds.push(layerId);
    }
    const globalActions = new Set(role?.globalActions || []);
    return { byLayerId, allowedLayerIds, globalActions };
};

const fs = require('fs');
const path = require('path');
const logPath = path.join(__dirname, '../auth-debug.log');

// authenticate + attach user, role, perm index
const authenticate = async (req, res, next) => {
    // Prefer header accessToken; cookie refresh is handled in controller
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'NO_TOKEN' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, jwtVerifyOpts);
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] AUTH: userId=${decoded.userId} token=${token.slice(-10)}\n`);

        const user = await User.findById(decoded.userId).populate({
            path: 'role',
            populate: { path: 'permissions.layer', select: '_id name' },
        });

        if (!user) {
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] ERROR: User NOT FOUND for id: ${decoded.userId}\n`);
            return res.status(401).json({ error: 'USER_NOT_FOUND' });
        }
        if (!user.role) {
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] ERROR: User ${user.username} has NO ROLE\n`);
            return res.status(401).json({ error: 'USER_NO_ROLE' });
        }

        const { byLayerId, allowedLayerIds, globalActions } = buildPermissionIndex(user.role);
        req.user = user;
        req.user._permByLayerId = byLayerId;
        req.user._globalActions = globalActions;
        req.allowedLayerIds = allowedLayerIds;
        next();
    } catch (err) {
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] CATCH: ${err.message}\n`);
        if (err?.name === 'TokenExpiredError') return res.status(401).json({ error: 'TOKEN_EXPIRED' });
        return res.status(401).json({ error: 'INVALID_TOKEN' });
    }
};

const getResourceId = (req, paramNames = ['id', 'layerId']) => {
    for (const k of paramNames) if (req.params?.[k]) return String(req.params[k]);
    return null;
};

// resource-scoped permission
const hasPermission = (action, resourceType, opts = {}) => {
    const { allowGlobal = true, paramNames = ['id', 'layerId'] } = opts;
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role) return res.status(403).json({ error: 'FORBIDDEN_NO_ROLE' });
        if (role.name === 'admin') return next();

        if (allowGlobal && resourceType) {
            const key = `${resourceType.toLowerCase()}s:${action}`;
            if (req.user?._globalActions?.has(key)) return next();
        }

        const resourceId = getResourceId(req, paramNames);
        if (!resourceId) return res.status(400).json({ error: 'RESOURCE_ID_REQUIRED' });

        const set = req.user?._permByLayerId?.get(resourceId);
        if (set && set.has(action)) return next();

        return res.status(403).json({ error: 'FORBIDDEN' });
    };
};

// list endpoints: allow if global list or any allowed layer
const requireAny = (action, resourceType) => {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role) return res.status(403).json({ error: 'FORBIDDEN_NO_ROLE' });
        if (role.name === 'admin') return next();

        const key = `${resourceType.toLowerCase()}s:${action}`;
        if (req.user?._globalActions?.has(key)) return next();

        if (Array.isArray(req.allowedLayerIds) && req.allowedLayerIds.length > 0) return next();

        return res.status(403).json({ error: 'FORBIDDEN_NONE_ALLOWED' });
    };
};

const requireRole = (roleName) => (req, res, next) => {
    const name = req.user?.role?.name;
    if (name === roleName) return next();
    return res.status(403).json({ error: 'FORBIDDEN_ROLE' });
};

const hasGlobal = (...keys) => (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(403).json({ error: 'FORBIDDEN_NO_ROLE' });
    if (role.name === 'admin') return next();

    const g = req.user?._globalActions || new Set();
    const ok = keys.some((k) => g.has(k));
    if (ok) return next();

    return res.status(403).json({ error: 'FORBIDDEN' });
};

module.exports = { authenticate, hasPermission, requireAny, requireRole, hasGlobal };
