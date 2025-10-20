const express = require('express');
const router = express.Router();
const {
    createLayer,
    getAllLayers,
    getLayerById,
    updateLayer,
    deleteLayer,
    importLayerFromGeoJson,
    uploadGeoJsonToLayer
} = require('../controllers/layerController');

const { authenticate, hasPermission } = require('../middleware/auth');
const uploadGeojson = require('../middleware/uploadGeojson');

// The `authenticate` middleware runs for all layer routes
router.use(authenticate);

// Route to get all layers a user can see. Filtering is handled in the controller.
router.get('/', getAllLayers);

// Anyone with 'view' permission for this specific layer can get it
router.get('/:id', hasPermission('view', 'Layer'), getLayerById);

// Only users with a general 'create' permission (for now, admin) can create a new layer.
// This might need a more specific permission later.
router.post('/', hasPermission('create', 'Layer'), createLayer);

// Importing is like creating
router.post('/import', hasPermission('create', 'Layer'), uploadGeojson.single('file'), importLayerFromGeoJson);

// Must have 'edit' permission for the specific layer
router.put('/:id', hasPermission('edit', 'Layer'), updateLayer);

// Must have 'delete' permission for the specific layer
router.delete('/:id', hasPermission('delete', 'Layer'), deleteLayer);

module.exports = router;
