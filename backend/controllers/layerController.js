const Layer = require('../models/Layer');

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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Decode file buffer from TIS-620 to UTF-8
        const utf8String = iconv.decode(req.file.buffer, 'TIS-620');

        // Parse KML string into a DOM structure
        const dom = new JSDOM(utf8String, { contentType: 'application/xml' });

        // Convert KML DOM to GeoJSON
        const geoJson = kml(dom.window.document);

        if (!geoJson.features || geoJson.features.length === 0) {
            throw new Error('KML file does not contain any features.');
        }

        // --- Create the Layer ---
        // Derive layer name from KML folder name or file name
        const layerName = geoJson.name || req.file.originalname.replace(/\.kml$/i, '');

        // Derive schema from the properties of the first feature
        const firstFeatureProps = geoJson.features[0].properties;
        const fields = Object.keys(firstFeatureProps).map(key => ({
            name: key.toLowerCase().replace(/[^a-z0-9_]/gi, ''), // Sanitize name
            label: key, // Original key as label
            type: typeof firstFeatureProps[key] === 'number' ? 'Number' : 'String', // Simple type inference
            required: false
        }));

        const newLayer = new Layer({
            name: layerName,
            geometryType: geoJson.features[0].geometry.type, // Assume all features have same type
            fields: fields
        });
        const savedLayer = await newLayer.save({ session });


        // --- Create GeoObjects for each feature ---
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

        await session.commitTransaction();
        res.status(201).json({ message: `Successfully imported ${geoJson.features.length} objects into new layer '${layerName}'.` });

    } catch (error) {
        await session.abortTransaction();
        console.error("KML Import Error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        session.endSession();
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
