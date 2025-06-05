const mongoose = require('mongoose');

const BinSchema = new mongoose.Schema({
    serial: { type: String, required: true },
    size: { type: Number, required: true, enum: [1, 2, 3] },
    status: {
        type: String,
        enum: ["active", "broken", "lost", "replaced", "removed", "deleted"],
        default: "active"
    },
    imageUrls: [{ type: String }],
    installedAt: { type: Date, default: Date.now },   // วันที่ติดตั้ง/เปลี่ยนถัง
}, { _id: false });

const BinChangeHistorySchema = new mongoose.Schema({
    bin: BinSchema, // สถานะ/รายละเอียด bin ที่เกิดขึ้น
    action: {
        type: String,
        enum: [
            "installed",     // ติดตั้งใหม่
            "active",     // ใช้งาน
            "broken",        // แจ้งชำรุด
            "lost",          // แจ้งหาย
            "replaced",      // เปลี่ยนถัง
            "removed",       // นำถังออก
            "deleted"        // soft delete
        ],
        required: true
    },
    changeDate: { type: Date, default: Date.now },
    note: { type: String }
}, { _id: false });

const GarbageBinPointSchema = new mongoose.Schema({
    locationName: { type: String, required: true },
    description: { type: String },
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: (arr) => arr.length === 2,
                message: "coordinates ต้องเป็น [lng, lat]"
            }
        }
    },
    images: [{ type: String }], // ภาพของ "จุด"
    currentBin: BinSchema,      // bin ที่ใช้งานปัจจุบัน (หรือ null ถ้าไม่มีถัง)
    history: [BinChangeHistorySchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

GarbageBinPointSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('GarbageBinPoint', GarbageBinPointSchema);
