const mongoose = require('mongoose');

const BinChangeHistorySchema = new mongoose.Schema({
    bin: {
        serial: { type: String, required: true },
        size: {
            type: Number,
            required: true,
            enum: [1, 2, 3] // จำกัดให้มีแค่ 1,2,3
        },
        status: { type: String, default: "active" },
        imageUrls: [{ type: String }],
    },
    changeDate: { type: Date, default: Date.now },
    note: { type: String },
}, { _id: false });

const GarbageBinPointSchema = new mongoose.Schema({
    locationName: { type: String, required: true },
    description: { type: String },
    coordinates: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
            required: true
        },
        coordinates: { // [lng, lat]
            type: [Number],
            required: true,
            validate: {
                validator: (arr) => arr.length === 2,
                message: "coordinates ต้องเป็น [lng, lat]"
            }
        }
    },
    images: [{ type: String }],
    currentBin: {
        serial: { type: String, required: true },
        size: {
            type: Number,
            required: true,
            enum: [1, 2, 3] // จำกัดให้มีแค่ 1,2,3
        },
        status: { type: String, default: "active" },
        imageUrls: [{ type: String }],
    },
    history: [BinChangeHistorySchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// เพิ่ม geospatial index
GarbageBinPointSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('GarbageBinPoint', GarbageBinPointSchema);
