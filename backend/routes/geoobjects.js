const express = require('express');
const router = express.Router();
const {
    createGeoObject,
    getGeoObjectsByLayer,
    getGeoObjectById,
    updateGeoObject,
    deleteGeoObject
} = require('../controllers/geoObjectController');

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes here are protected and require a user to be authenticated.
router.use(auth);

router.route('/')
    .post(upload.array('images', 10), createGeoObject) // Handle up to 10 image uploads
    .get(getGeoObjectsByLayer);

router.route('/:id')
    .get(getGeoObjectById)
    .put(upload.array('images', 10), updateGeoObject) // Also handle uploads on update
    .delete(deleteGeoObject);

module.exports = router;
