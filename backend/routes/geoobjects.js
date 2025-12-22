// routes/geoobjects.js
'use strict';
const express = require('express');
const router = express.Router();

const {
    createGeoObject,
    getGeoObjectsByLayer,
    getGeoObjectById,
    updateGeoObject,
    deleteGeoObject,
} = require('../controllers/geoObjectController');

const { authenticate } = require('../middleware/auth');
const { checkGeoObjectPermission } = require('../middleware/geoObjectPermission');
const upload = require('../middleware/upload');

router.use(authenticate);

router.post('/', checkGeoObjectPermission('create'), upload.array('images', 10), createGeoObject);
router.get('/', checkGeoObjectPermission('read'), getGeoObjectsByLayer);
router.get('/:id', checkGeoObjectPermission('read'), getGeoObjectById);
router.put('/:id', checkGeoObjectPermission('update'), upload.array('images', 10), updateGeoObject);
router.delete('/:id', checkGeoObjectPermission('delete'), deleteGeoObject);

module.exports = router;
