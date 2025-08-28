const mongoose = require('mongoose');

// This sub-schema defines the structure for a custom field in a layer.
const FieldSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Field name is required.'],
        trim: true,
        lowercase: true,
        // Ensures the field name can be used as a key in MongoDB.
        match: [/^[a-zA-Z0-9_]+$/, 'Field name can only contain letters, numbers, and underscores.']
    },
    label: {
        type: String,
        required: [true, 'Field label is required.'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Field type is required.'],
        enum: ['String', 'Number', 'Boolean', 'Date']
    },
    required: {
        type: Boolean,
        default: false
    }
}, { _id: false });


const LayerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Layer name is required.'],
        unique: true,
        trim: true
    },
    geometryType: {
        type: String,
        required: [true, 'Geometry type is required.'],
        enum: ['Point', 'Polygon', 'LineString']
    },
    // An array of custom fields for this layer.
    fields: [FieldSchema],
    color: {
        type: String,
        default: '#ff0000' // Default to red
    },
    icon: {
        type: String,
        default: 'default' // Default icon
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Layer', LayerSchema);
