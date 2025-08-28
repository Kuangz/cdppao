const express = require('express');
const router = express.Router();

const { uploadGeoJsonToLayer } = require('../controllers/layerController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const uploadGeojson = require('../middleware/uploadGeojson');

router.post('/:id', auth, isAdmin, uploadGeojson.single('file'), uploadGeoJsonToLayer);

module.exports = router;
