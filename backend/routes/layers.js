// routes/layers.js
'use strict';
const express = require('express');
const router = express.Router();

const {
    createLayer,
    getAllLayers,
    getLayerById,
    updateLayer,
    deleteLayer,
    importLayerFromGeoJson,
} = require('../controllers/layerController');

const { authenticate, hasPermission, requireAny, hasGlobal } = require('../middleware/auth');
const uploadGeojson = require('../middleware/uploadGeojson');

router.use(authenticate);

router.get('/', requireAny('list', 'Layer'), getAllLayers);
router.get('/:id', hasPermission('read', 'Layer'), getLayerById);

router.post('/', hasGlobal('layers:create'), createLayer);
router.post('/import', hasGlobal('layers:create'), uploadGeojson.single('file'), importLayerFromGeoJson);

router.put('/:id', hasPermission('update', 'Layer'), updateLayer);
router.delete('/:id', hasPermission('delete', 'Layer'), deleteLayer);

module.exports = router;
