const express = require('express');
const router = express.Router();
const {
    createLayer,
    getAllLayers,
    getLayerById,
    updateLayer,
    deleteLayer,
    importLayerFromKML
} = require('../controllers/layerController');

const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const uploadKml = require('../middleware/uploadKml');

// Public routes (all authenticated users can access)
router.get('/', auth, getAllLayers);
router.get('/:id', auth, getLayerById);

// Admin-only routes
router.post('/', auth, isAdmin, createLayer);
router.post('/import', auth, isAdmin, uploadKml.single('file'), importLayerFromKML);
router.put('/:id', auth, isAdmin, updateLayer);
router.delete('/:id', auth, isAdmin, deleteLayer);

module.exports = router;
