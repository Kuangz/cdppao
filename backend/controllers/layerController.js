const Layer = require('../models/Layer');
const mongoose = require('mongoose');

// @desc    Create a new layer
// @route   POST /api/layers
// @access  Admin
const createLayer = async (req, res) => {
    const { name, geometryType, fields, color, icon } = req.body;

    try {
        const layerExists = await Layer.findOne({ name });
        if (layerExists) {
            return res.status(400).json({ error: 'Layer with this name already exists.' });
        }

        const layer = new Layer({
            name,
            geometryType,
            fields,
            color,
            icon
        });

        const createdLayer = await layer.save();
        res.status(201).json(createdLayer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get all layers
// @route   GET /api/layers
// @access  Public
const getAllLayers = async (req, res) => {
    try {
        const layers = await Layer.find({});
        res.json(layers);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get a single layer by ID
// @route   GET /api/layers/:id
// @access  Public
const getLayerById = async (req, res) => {
    try {
        const layer = await Layer.findById(req.params.id);
        if (layer) {
            res.json(layer);
        } else {
            res.status(404).json({ error: 'Layer not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Update a layer
// @route   PUT /api/layers/:id
// @access  Admin
const updateLayer = async (req, res) => {
    try {
        const { name, geometryType, fields, displaySettings, color, icon } = req.body;
        const layer = await Layer.findById(req.params.id);

        if (layer) {
            layer.name = name || layer.name;
            layer.geometryType = geometryType || layer.geometryType;
            layer.fields = fields || layer.fields;
            layer.color = color || layer.color;
            layer.icon = icon || layer.icon;

            // Update displaySettings. If it's not provided, keep the old one.
            if (displaySettings) {
                layer.displaySettings = displaySettings;
            }

            const updatedLayer = await layer.save();
            res.json(updatedLayer);
        } else {
            res.status(404).json({ error: 'Layer not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Delete a layer
// @route   DELETE /api/layers/:id
// @access  Admin
const deleteLayer = async (req, res) => {
    try {
        const layer = await Layer.findById(req.params.id);

        if (layer) {
            await layer.deleteOne();
            res.json({ message: 'Layer removed successfully' });
        } else {
            res.status(404).json({ error: 'Layer not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

const importLayerFromGeoJson = async (req, res) => {
    const GeoObject = require('../models/GeoObject');

    if (!req.file) {
        return res.status(400).json({ error: 'No GeoJSON file uploaded.' });
    }

    const useTransactions = process.env.DB_SUPPORTS_TRANSACTIONS === 'true';
    const session = useTransactions ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        const geoJson = JSON.parse(req.file.buffer.toString());

        if (!geoJson.features || geoJson.features.length === 0) {
            throw new Error('GeoJSON file does not contain any features.');
        }

        const layerName = geoJson.name || req.file.originalname.replace(/\.(geojson|json)$/i, '');

        // Check if a layer with this name already exists
        const layerExists = await Layer.findOne({ name: layerName }).session(session);
        if (layerExists) {
            throw new Error(`A layer with the name "${layerName}" already exists.`);
        }

        const firstFeatureProps = geoJson.features[0].properties || {};
        const fields = Object.keys(firstFeatureProps).map(key => ({
            name: key.toLowerCase().replace(/[^a-z0-9_]/gi, ''),
            label: key,
            type: typeof firstFeatureProps[key] === 'number' ? 'Number' : 'String',
            required: false
        }));

        const newLayer = new Layer({
            name: layerName,
            geometryType: geoJson.features[0].geometry.type,
            fields: fields
        });
        const savedLayer = await newLayer.save({ session });

        const geoObjectPromises = geoJson.features.map(feature => {
            const sanitizedProperties = {};
            if (feature.properties) {
                for (const key in feature.properties) {
                    const sanitizedKey = key.toLowerCase().replace(/[^a-z0-9_]/gi, '');
                    sanitizedProperties[sanitizedKey] = feature.properties[key];
                }
            }
            const geoObject = new GeoObject({
                layerId: savedLayer._id,
                geometry: feature.geometry,
                properties: sanitizedProperties,
                history: [{ action: 'created', userId: req.user.id, note: 'Imported from GeoJSON' }]
            });
            return geoObject.save({ session });
        });

        await Promise.all(geoObjectPromises);

        if (session) await session.commitTransaction();
        res.status(201).json({ message: `Successfully imported ${geoJson.features.length} objects into new layer '${layerName}'.` });

    } catch (error) {
        if (session) await session.abortTransaction();
        console.error("GeoJSON Import Error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (session) session.endSession();
    }
};


const uploadGeoJsonToLayer = async (req, res) => {
    const { id } = req.params;
    const GeoObject = require('../models/GeoObject');

    if (!req.file) {
        return res.status(400).json({ error: 'No GeoJSON file uploaded.' });
    }

    const useTransactions = process.env.DB_SUPPORTS_TRANSACTIONS === 'true';
    const session = useTransactions ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        const layer = await Layer.findById(id).session(session);
        if (!layer) {
            throw new Error('Layer not found.');
        }

        const geoJson = JSON.parse(req.file.buffer.toString());

        if (!geoJson.features) { // It can be a FeatureCollection with empty features array
            throw new Error('GeoJSON file must be a FeatureCollection.');
        }

        // Step 1: Delete existing GeoObjects for this layer
        await GeoObject.deleteMany({ layerId: id }, { session });

        // Step 2: Create new GeoObjects from the uploaded file
        const geoObjectPromises = geoJson.features.map(feature => {
            // Basic validation
            if (!feature.geometry || !feature.geometry.type || !feature.geometry.coordinates) {
                console.warn('Skipping feature with invalid geometry:', feature);
                return null;
            }
            // Optional: Check if feature geometry type matches layer geometry type
            if (feature.geometry.type !== layer.geometryType) {
                console.warn(`Skipping feature with mismatched geometry type. Expected ${layer.geometryType}, got ${feature.geometry.type}.`);
                return null;
            }

            const sanitizedProperties = {};
            if (feature.properties) {
                for (const key in feature.properties) {
                    const sanitizedKey = key.toLowerCase().replace(/[^a-z0-9_]/gi, '');
                    sanitizedProperties[sanitizedKey] = feature.properties[key];
                }
            }

            const geoObject = new GeoObject({
                layerId: id,
                geometry: feature.geometry,
                properties: sanitizedProperties,
                history: [{ action: 'created', userId: req.user.id, note: 'Created from GeoJSON upload' }]
            });
            return geoObject.save({ session });
        }).filter(p => p !== null); // Filter out skipped features

        await Promise.all(geoObjectPromises);

        // Step 3: Update the layer's upload history
        const historyEntry = {
            filename: req.file.originalname,
            uploadedBy: req.user.id,
            uploadedAt: new Date()
        };
        layer.uploadHistory.push(historyEntry);
        await layer.save({ session });

        if (session) await session.commitTransaction();
        res.status(200).json({ message: `Successfully overwrote layer data with ${geoJson.features.length} objects.` });

    } catch (error) {
        if (session) await session.abortTransaction();
        console.error("GeoJSON Upload Error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (session) session.endSession();
    }
};

module.exports = {
    createLayer,
    getAllLayers,
    getLayerById,
    updateLayer,
    deleteLayer,
    importLayerFromGeoJson,
    uploadGeoJsonToLayer
};
