const fs = require('fs');
const path = require('path');
const GarbageBinPoint = require("../models/GarbageBinPoint");

const uploadsRoot = path.join(__dirname, '..', 'uploads', 'garbage_bins');
const unlinkAsync = async (imgPath) => {
    const filePath = path.join(__dirname, '..', imgPath);
    // ป้องกัน path traversal
    if (filePath.startsWith(uploadsRoot)) {
        return new Promise(resolve => fs.unlink(filePath, () => resolve()));
    }
    return Promise.resolve();
};

// -- GET All Points
exports.listPoints = async (req, res) => {
    try {
        const points = await GarbageBinPoint.find();
        res.json(points);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// -- GET One Point
exports.getPoint = async (req, res) => {
    try {
        const point = await GarbageBinPoint.findById(req.params.id);
        if (!point) return res.status(404).json({ error: "Not found" });
        res.json(point);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createPoint = async (req, res) => {
    try {
        const { locationName, description, lat, lng, currentBin } = req.body;
        const images = req.files ? req.files.map(f => '/uploads/garbage_bins/' + f.filename) : [];
        const point = await GarbageBinPoint.create({
            locationName,
            description,
            coordinates: {
                type: "Point",
                coordinates: [Number(lng), Number(lat)]
            },
            images,
            currentBin: currentBin ? JSON.parse(currentBin) : undefined
        });
        res.status(201).json(point);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updatePoint = async (req, res) => {
    try {
        const { locationName, description, lat, lng, currentBin, existingImages } = req.body;
        // existingImages อาจเป็น array หรือ string
        let keepImages = [];
        if (existingImages) {
            if (Array.isArray(existingImages)) {
                keepImages = existingImages;
            } else if (typeof existingImages === "string") {
                keepImages = [existingImages];
            }
        }

        // รูปใหม่ที่ upload
        const newImages = req.files ? req.files.map(f => '/uploads/garbage_bins/' + f.filename) : [];
        // รวมทั้งหมด
        const allImages = [...keepImages, ...newImages];

        // หา point เก่าก่อน update
        const point = await GarbageBinPoint.findById(req.params.id);
        if (!point) return res.status(404).json({ error: "Not found" });

        // ตรวจสอบไฟล์ที่ต้องลบ
        const removedImages = (point.images || []).filter(img => !allImages.includes(img));
        await Promise.all(removedImages.map(unlinkAsync));

        // เตรียม object สำหรับ update
        const update = {
            ...(locationName && { locationName }),
            ...(description !== undefined && { description }),
            ...(lat && lng ? { coordinates: { type: "Point", coordinates: [Number(lng), Number(lat)] } } : {}),
            images: allImages,
            ...(currentBin ? { currentBin: JSON.parse(currentBin) } : {})
        };

        const updated = await GarbageBinPoint.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deletePoint = async (req, res) => {
    try {
        const point = await GarbageBinPoint.findByIdAndDelete(req.params.id);
        if (!point) return res.status(404).json({ error: "Not found" });

        // ลบไฟล์ทั้งหมดที่ผูกกับ images (async)
        if (Array.isArray(point.images)) {
            await Promise.all(point.images.map(unlinkAsync));
        }

        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


// -- ADD Bin Change History (และ optionally update currentBin)
exports.addBinHistory = async (req, res) => {
    try {
        const { serial, size, status, imageUrls, note, updateCurrentBin } = req.body;
        const historyEntry = {
            bin: { serial, size, status, imageUrls: imageUrls || [] },
            changeDate: new Date(),
            note
        };
        const point = await GarbageBinPoint.findById(req.params.id);
        if (!point) return res.status(404).json({ error: "Not found" });

        point.history.push(historyEntry);

        if (updateCurrentBin) {
            point.currentBin = { serial, size, status, imageUrls: imageUrls || [] };
        }

        await point.save();
        res.json(point);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getNearbyPoints = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        const rad = Number(radius) || 500;
        if (!lat || !lng) return res.status(400).json({ error: "ต้องระบุ lat/lng" });

        const points = await GarbageBinPoint.find({
            coordinates: {
                $near: {
                    $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
                    $maxDistance: rad,
                }
            }
        });
        res.json(points);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
