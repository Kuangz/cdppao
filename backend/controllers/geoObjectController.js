const GeoObject = require('../models/GeoObject');
const Layer = require('../models/Layer');
const mongoose = require('mongoose');

// Helper function to validate properties against a layer's field schema
const validateProperties = (properties, fields) => {
    for (const field of fields) {
        if (field.required && (properties[field.name] === undefined || properties[field.name] === null)) {
            throw new Error(`Property '${field.label}' is required.`);
        }
        if (properties[field.name] !== undefined) {
            let value = properties[field.name];
            switch (field.type) {
                case 'String':
                    if (typeof value !== 'string') throw new Error(`Property '${field.label}' must be a string.`);
                    break;
                case 'Number':
                    if (typeof value !== 'number') throw new Error(`Property '${field.label}' must be a number.`);
                    break;
                case 'Boolean':
                    if (typeof value !== 'boolean') throw new Error(`Property '${field.label}' must be a boolean.`);
                    break;
                case 'Date':
                    if (isNaN(Date.parse(value))) throw new Error(`Property '${field.label}' must be a valid date.`);
                    break;
                default:
                    throw new Error(`Unknown field type '${field.type}'.`);
            }
        }
    }
    // Check for extra properties that are not in the schema
    for (const propName in properties) {
        if (!fields.some(f => f.name === propName)) {
            throw new Error(`Property '${propName}' is not allowed in this layer.`);
        }
    }
};

// @desc    Create a new geo-object
// @route   POST /api/geoobjects
// @access  Authenticated Users
const createGeoObject = async (req, res) => {
    const { layerId, geometry, properties } = req.body;
    try {
        const layer = await Layer.findById(layerId);
        if (!layer) {
            return res.status(404).json({ error: 'Layer not found.' });
        }

        // Validate geometry type
        if (layer.geometryType !== geometry.type) {
            throw new Error(`Invalid geometry type. Expected '${layer.geometryType}', but got '${geometry.type}'.`);
        }

        // Validate properties against the layer's schema
        validateProperties(properties, layer.fields);

        const geoObject = new GeoObject({
            layerId,
            geometry,
            properties,
            history: [{ action: 'created', userId: req.user.id }]
        });

        const createdGeoObject = await geoObject.save();

        res.status(201).json(createdGeoObject);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get all geo-objects for a specific layer
// @route   GET /api/geoobjects?layerId=:layerId
// @access  Authenticated Users
const getGeoObjectsByLayer = async (req, res) => {
    try {
        const { layerId } = req.query;
        if (!layerId) {
            return res.status(400).json({ error: 'layerId query parameter is required.' });
        }
        const objects = await GeoObject.find({ layerId: layerId });
        res.json(objects);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get a single geo-object by ID
// @route   GET /api/geoobjects/:id
// @access  Authenticated Users
const getGeoObjectById = async (req, res) => {
    try {
        const geoObject = await GeoObject.findById(req.params.id).populate('layerId', 'name');
        if (geoObject) {
            res.json(geoObject);
        } else {
            res.status(404).json({ error: 'Geo-object not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Update a geo-object
// @route   PUT /api/geoobjects/:id
// @access  Authenticated Users
const updateGeoObject = async (req, res) => {
    const { properties, geometry } = req.body;
    try {
        const geoObject = await GeoObject.findById(req.params.id);
        if (!geoObject) {
            return res.status(404).json({ error: 'Geo-object not found' });
        }

        const layer = await Layer.findById(geoObject.layerId);
        if (!layer) {
            return res.status(404).json({ error: 'Associated layer not found.' });
        }

        // Keep track of old properties for history diff
        const oldProperties = JSON.parse(JSON.stringify(geoObject.properties));

        if (properties) {
            validateProperties(properties, layer.fields);
            geoObject.properties = properties;
        }

        if (geometry) {
             if (layer.geometryType !== geometry.type) {
                throw new Error(`Invalid geometry type. Expected '${layer.geometryType}', but got '${geometry.type}'.`);
            }
            geoObject.geometry = geometry;
        }

        geoObject.history.push({
            action: 'updated',
            userId: req.user.id,
            diff: { before: oldProperties, after: geoObject.properties }
        });

        const updatedGeoObject = await geoObject.save();
        res.json(updatedGeoObject);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// @desc    Delete a geo-object
// @route   DELETE /api/geoobjects/:id
// @access  Authenticated Users
const deleteGeoObject = async (req, res) => {
    try {
        const geoObject = await GeoObject.findById(req.params.id);
        if (geoObject) {
            await geoObject.deleteOne();
            res.json({ message: 'Geo-object removed' });
        } else {
            res.status(404).json({ error: 'Geo-object not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports = {
    createGeoObject,
    getGeoObjectsByLayer,
    getGeoObjectById,
    updateGeoObject,
    deleteGeoObject
};
