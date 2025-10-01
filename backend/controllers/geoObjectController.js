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
    // With multer, text fields are in req.body, files are in req.files
    const { layerId } = req.body;
    const geometry = JSON.parse(req.body.geometry);
    const properties = JSON.parse(req.body.properties);

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

        const imageUrls = req.files ? req.files.map(file => file.path) : [];

        const initialState = {
            properties,
            geometry,
            images: imageUrls
        };

        const geoObject = new GeoObject({
            layerId,
            geometry,
            properties,
            images: imageUrls,
            status: 'active', // Explicitly set status on creation
            history: [{
                action: 'created',
                userId: req.user.id,
                diff: { before: null, after: initialState }
            }]
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
        // Only return active objects
        const objects = await GeoObject.find({ layerId: layerId, status: 'active' });
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

        // Do not return deleted objects, and only populate history for active objects
        if (geoObject && geoObject.status !== 'deleted') {
            // Safely populate history only for the object we intend to return
            await geoObject.populate('history.userId', 'username');
            res.json(geoObject);
        } else {
            res.status(404).json({ error: 'Geo-object not found' });
        }
    } catch (error) {
        console.error("Error in getGeoObjectById:", error); // Log the actual error for debugging
        res.status(500).json({ error: 'Server error' });
    }
};

const fs = require('fs');

// @desc    Update a geo-object
// @route   PUT /api/geoobjects/:id
// @access  Authenticated Users
const updateGeoObject = async (req, res) => {
    try {
        const geoObject = await GeoObject.findById(req.params.id);
        if (!geoObject) {
            return res.status(404).json({ error: 'Geo-object not found' });
        }

        const layer = await Layer.findById(geoObject.layerId);
        if (!layer) {
            return res.status(404).json({ error: 'Associated layer not found.' });
        }

        // Keep track of the full old state for history diff
        const oldState = {
            properties: JSON.parse(JSON.stringify(geoObject.properties)),
            geometry: JSON.parse(JSON.stringify(geoObject.geometry)),
            images: [...geoObject.images]
        };

        if (req.body.properties) {
            const properties = JSON.parse(req.body.properties);
            validateProperties(properties, layer.fields);
            geoObject.properties = properties;
        }

        if (req.body.geometry) {
            const geometry = JSON.parse(req.body.geometry);
            if (layer.geometryType !== geometry.type) {
                throw new Error(`Invalid geometry type. Expected '${layer.geometryType}', but got '${geometry.type}'.`);
            }
            geoObject.geometry = geometry;
        }

        // Handle image updates
        const newImageUrls = req.files ? req.files.map(file => file.path) : [];
        let existingImages = req.body.existingImages ? (Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages]) : [];

        // Find images to delete
        const imagesToDelete = oldState.images.filter(img => !existingImages.includes(img));
        imagesToDelete.forEach(filePath => {
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Failed to delete image: ${filePath}`, err);
            });
        });

        geoObject.images = [...existingImages, ...newImageUrls];

        // Create a comprehensive diff for the history log
        const newState = {
            properties: geoObject.properties,
            geometry: geoObject.geometry,
            images: geoObject.images
        };

        geoObject.history.push({
            action: 'updated',
            userId: req.user.id,
            diff: { before: oldState, after: newState }
        });

        const updatedGeoObject = await geoObject.save();
        res.json(updatedGeoObject);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// @desc    Delete a geo-object (soft delete)
// @route   DELETE /api/geoobjects/:id
// @access  Authenticated Users
const deleteGeoObject = async (req, res) => {
    try {
        const geoObject = await GeoObject.findById(req.params.id);
        if (!geoObject) {
            return res.status(404).json({ error: 'Geo-object not found' });
        }

        if (geoObject.status === 'deleted') {
            return res.status(400).json({ error: 'Geo-object is already deleted' });
        }

        geoObject.status = 'deleted';
        geoObject.history.push({
            action: 'deleted',
            userId: req.user.id,
            changedAt: new Date()
        });

        await geoObject.save();
        res.json({ message: 'Geo-object marked as deleted' });

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
