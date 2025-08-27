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

// All routes here are protected and require a user to be authenticated.
router.use(auth);

router.route('/')
    .post(createGeoObject)
    .get(getGeoObjectsByLayer);

router.route('/:id')
    .get(getGeoObjectById)
    .put(updateGeoObject)
    .delete(deleteGeoObject);

module.exports = router;
