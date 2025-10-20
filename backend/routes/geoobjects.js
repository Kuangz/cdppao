const express = require('express');
const router = express.Router();
const {
    createGeoObject,
    getGeoObjectsByLayer,
    getGeoObjectById,
    updateGeoObject,
    deleteGeoObject
} = require('../controllers/geoObjectController');

const { authenticate, hasPermission } = require('../middleware/auth');
const { checkGeoObjectPermission } = require('../middleware/geoObjectPermission');
const upload = require('../middleware/upload');

// Authenticate all requests
router.use(authenticate);

// For creating, the layerId is in the body, checked by middleware
router.post('/', upload.array('images', 10), checkGeoObjectPermission('create'), createGeoObject);

// For getting objects by layer, the layerId is in the query, checked by middleware
router.get('/', checkGeoObjectPermission('view'), getGeoObjectsByLayer);

// For specific object operations, the permission is checked based on the object's layer
router.get('/:id', checkGeoObjectPermission('view'), getGeoObjectById);
router.put('/:id', upload.array('images', 10), checkGeoObjectPermission('edit'), updateGeoObject);
router.delete('/:id', checkGeoObjectPermission('delete'), deleteGeoObject);

module.exports = router;
