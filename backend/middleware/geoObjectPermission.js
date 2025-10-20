const User = require('../models/User');
const GeoObject = require('../models/GeoObject');

// Middleware factory to check permissions for GeoObject operations
const checkGeoObjectPermission = (action) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ error: 'Forbidden: No role assigned' });
      }

      // Admin has all permissions
      if (req.user.role.name === 'admin') {
        return next();
      }

      let layerId;

      // Determine layerId from request
      if (req.method === 'POST') { // Create
        layerId = req.body.layerId;
      } else if (req.query.layerId) { // Get by Layer
        layerId = req.query.layerId;
      } else if (req.params.id) { // Get/Update/Delete by GeoObject ID
        const geoObject = await GeoObject.findById(req.params.id);
        if (!geoObject) {
          return res.status(404).json({ error: 'GeoObject not found' });
        }
        layerId = geoObject.layerId.toString();
      }

      if (!layerId) {
        return res.status(400).json({ error: 'Layer ID not specified' });
      }

      const permission = req.user.role.permissions.find(p => p.layer._id.toString() === layerId);

      if (permission && permission.actions.includes(action)) {
        return next();
      }

      return res.status(403).json({ error: 'Forbidden: Insufficient permissions for this layer' });
    } catch (error) {
      res.status(500).json({ error: 'Server error during permission check' });
    }
  };
};

module.exports = { checkGeoObjectPermission };
