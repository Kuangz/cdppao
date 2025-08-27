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

module.exports = {
    createLayer,
    getAllLayers,
    getLayerById,
    updateLayer,
    deleteLayer
};
