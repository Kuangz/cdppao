const mongoose = require('mongoose');

// A sub-schema for logging changes to a GeoObject.
const ChangeHistorySchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['created', 'updated', 'deleted']
    },
    changedAt: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Can store a "diff" of what was changed.
    diff: {
        type: mongoose.Schema.Types.Mixed
    }
}, { _id: false });


const GeoObjectSchema = new mongoose.Schema({
    layerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Layer',
        required: true,
        index: true // Index for faster queries by layer
    },
    geometry: {
        type: {
            type: String,
            required: true,
            enum: ['Point', 'Polygon', 'LineString']
        },
        coordinates: {
            type: [], // Allows for flexible coordinate structures (e.g., [lng, lat] or [[[lng, lat], ...]])
            required: true
        }
    },
    properties: {
        type: mongoose.Schema.Types.Mixed, // For storing flexible, user-defined data
        default: {}
    },
    images: [{ type: String }], // To store URLs or paths of uploaded images
    history: [ChangeHistorySchema]
}, {
    timestamps: true
});

// Create a 2dsphere index on the geometry field for efficient geospatial queries.
GeoObjectSchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('GeoObject', GeoObjectSchema);
