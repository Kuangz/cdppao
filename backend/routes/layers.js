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

const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const uploadGeojson = require('../middleware/uploadGeojson');

// Public routes (all authenticated users can access)
router.get('/', auth, getAllLayers);
router.get('/:id', auth, getLayerById);

// Admin-only routes
router.post('/', auth, isAdmin, createLayer);
router.post('/import', auth, isAdmin, uploadGeojson.single('file'), importLayerFromGeoJson);
router.put('/:id', auth, isAdmin, updateLayer);
router.delete('/:id', auth, isAdmin, deleteLayer);

module.exports = router;
