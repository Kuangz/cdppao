const Layer = require('../models/Layer');
const mongoose = require('mongoose');

// @desc    Create a new layer
// @route   POST /api/layers
// @access  Admin
const createLayer = async (req, res) => {
    const { name, geometryType, fields } = req.body;

    try {
        const layerExists = await Layer.findOne({ name });
        if (layerExists) {
            return res.status(400).json({ error: 'Layer with this name already exists.' });
        }

        const layer = new Layer({
            name,
            geometryType,
            fields
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
        const { name, geometryType, fields } = req.body;
        const layer = await Layer.findById(req.params.id);

        if (layer) {
            layer.name = name || layer.name;
            layer.geometryType = geometryType || layer.geometryType;
            layer.fields = fields || layer.fields;

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

const importLayerFromKML = async (req, res) => {
    const { JSDOM } = require('jsdom');
    const { kml } = require('@tmcw/togeojson');
    const iconv = require('iconv-lite');
    const GeoObject = require('../models/GeoObject');

    if (!req.file) {
        return res.status(400).json({ error: 'No KML file uploaded.' });
    }

    const useTransactions = process.env.DB_SUPPORTS_TRANSACTIONS === 'true';
    const session = useTransactions ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        const utf8String = iconv.decode(req.file.buffer, 'TIS-620');
        const dom = new JSDOM(utf8String, { contentType: 'application/xml' });
        const geoJson = kml(dom.window.document);

        if (!geoJson.features || geoJson.features.length === 0) {
            throw new Error('KML file does not contain any features.');
        }

        const layerName = geoJson.name || req.file.originalname.replace(/\.kml$/i, '');
        const firstFeatureProps = geoJson.features[0].properties;
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
            for (const key in feature.properties) {
                const sanitizedKey = key.toLowerCase().replace(/[^a-z0-9_]/gi, '');
                sanitizedProperties[sanitizedKey] = feature.properties[key];
            }
            const geoObject = new GeoObject({
                layerId: savedLayer._id,
                geometry: feature.geometry,
                properties: sanitizedProperties,
                history: [{ action: 'created', userId: req.user.id, note: 'Imported from KML' }]
            });
            return geoObject.save({ session });
        });

        await Promise.all(geoObjectPromises);

        if (session) await session.commitTransaction();
        res.status(201).json({ message: `Successfully imported ${geoJson.features.length} objects into new layer '${layerName}'.` });

    } catch (error) {
        if (session) await session.abortTransaction();
        console.error("KML Import Error:", error);
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
    importLayerFromKML
};
