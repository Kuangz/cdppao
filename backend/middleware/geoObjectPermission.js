// middleware/geoObjectPermission.js
'use strict';

const GeoObject = require('../models/GeoObject');

// action: 'read' | 'create' | 'update' | 'delete'
const checkGeoObjectPermission = (action) => {
  return async (req, res, next) => {
    try {
      const role = req.user?.role;
      if (!role) return res.status(403).json({ error: 'FORBIDDEN_NO_ROLE' });
      if (role.name === 'admin') return next();

      let layerId = null;

      if (req.method === 'POST' && req.body?.layerId) layerId = String(req.body.layerId);
      if (!layerId && req.query?.layerId) layerId = String(req.query.layerId);

      if (!layerId && req.params?.id) {
        const obj = await GeoObject.findById(req.params.id).select('layerId');
        if (!obj) return res.status(404).json({ error: 'GeoObject not found' });
        layerId = String(obj.layerId);
      }

      if (!layerId) return res.status(400).json({ error: 'Layer ID not specified' });

      const set = req.user?._permByLayerId?.get(layerId);
      if (set && set.has(action)) return next();

      return res.status(403).json({ error: 'Forbidden: Insufficient permissions for this layer' });
    } catch (err) {
      console.error('checkGeoObjectPermission error:', err);
      return res.status(500).json({ error: 'Server error during permission check' });
    }
  };
};

module.exports = { checkGeoObjectPermission };
