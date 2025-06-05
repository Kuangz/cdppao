const fs = require('fs');
const path = require('path');
const GarbageBinPoint = require("../models/GarbageBinPoint");

// Utility
const uploadsRoot = path.join(__dirname, '..', 'uploads', 'garbage_bins');
const unlinkAsync = async (imgPath) => {
    const filePath = path.join(__dirname, '..', imgPath);
    if (filePath.startsWith(uploadsRoot)) {
        return new Promise(resolve => fs.unlink(filePath, () => resolve()));
    }
    return Promise.resolve();
};

exports.listPointsForMap = async (req, res) => {
    try {
        // ดึงเฉพาะ field ที่จำเป็น
        const points = await GarbageBinPoint.find(
            { "currentBin.status": { $ne: "deleted" } },
            {
                "locationName": 1,
                "coordinates": 1,
                "currentBin.status": 1,
                "currentBin.serial": 1,
            }
        );
        res.json(points);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// -- GET All Points (filter ไม่โชว์ deleted)
exports.listPoints = async (req, res) => {
    try {
        const {
            search = "",
            page = 1,
            pageSize = 10,
        } = req.query;

        const status = req.query['status[]']

        const filter = { "currentBin.status": { $ne: "deleted" } };
        if (Array.isArray(status)) {
            if (status.includes("removed")) {
                // ถ้ามี removed, ให้รวม removed และ currentBin=null
                const otherStatuses = status.filter(s => s !== "removed");
                const orConditions = [
                    { "currentBin.status": "removed" },
                    { currentBin: { $in: [null, undefined] } },
                ];
                if (otherStatuses.length) {
                    orConditions.push({ "currentBin.status": { $in: otherStatuses } });
                }
                filter.$or = orConditions;
            } else if (status.length) {
                filter["currentBin.status"] = { $in: status };
            }
        } else if (typeof status === "string" && status !== "") {
            if (status === "removed") {
                filter.$or = [
                    { "currentBin.status": "removed" },
                    { currentBin: { $in: [null, undefined] } }
                ];
            } else {
                filter["currentBin.status"] = status;
            }
        }



        if (search) {
            filter.locationName = { $regex: search, $options: "i" };
        }

        const _page = Math.max(Number(page), 1);
        const _pageSize = Math.max(Number(pageSize), 1);
        const skip = (_page - 1) * _pageSize;

        const [items, total] = await Promise.all([
            GarbageBinPoint.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(_pageSize),
            GarbageBinPoint.countDocuments(filter)
        ]);

        res.json({
            items,
            total,
            page: _page,
            pageSize: _pageSize
        });
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

// -- CREATE Point
exports.createPoint = async (req, res) => {
    try {
        const { locationName, description, lat, lng, serial, size, note } = req.body;
        const images = req.files ? req.files.map(f => '/uploads/garbage_bins/' + f.filename) : [];
        const currentBin = {
            serial,
            size: Number(size),
            status: "active",
            imageUrls: images,
            installedAt: new Date()
        };
        const history = [{
            bin: currentBin,
            action: "installed",
            changeDate: new Date(),
            note: note || "ติดตั้งใหม่"
        }];

        const point = await GarbageBinPoint.create({
            locationName,
            description,
            coordinates: {
                type: "Point",
                coordinates: [Number(lng), Number(lat)]
            },
            images,
            currentBin,
            history
        });
        res.status(201).json(point);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// -- UPDATE Point (ข้อมูลทั่วไป + อัปโหลดรูป, ไม่เกี่ยวกับสถานะถัง)
exports.updatePoint = async (req, res) => {
    try {
        const { locationName, description, lat, lng, existingImages, serial, size } = req.body;
        let keepImages = [];
        if (existingImages) {
            if (Array.isArray(existingImages)) {
                keepImages = existingImages;
            } else if (typeof existingImages === "string") {
                keepImages = [existingImages];
            }
        }
        const newImages = req.files ? req.files.map(f => '/uploads/garbage_bins/' + f.filename) : [];
        const allImages = [...keepImages, ...newImages];

        const point = await GarbageBinPoint.findById(req.params.id);
        if (!point) return res.status(404).json({ error: "Not found" });

        // ลบไฟล์จริงที่ user เอาออก
        const removedImages = (point.currentBin?.imageUrls || []).filter(img => !allImages.includes(img));
        await Promise.all(removedImages.map(unlinkAsync));

        point.locationName = locationName || point.locationName;
        point.description = description !== undefined ? description : point.description;
        if (lat && lng) {
            point.coordinates = { type: "Point", coordinates: [Number(lng), Number(lat)] };
        }
        point.images = allImages;

        if (point.currentBin) {
            point.currentBin.imageUrls = allImages;
            point.currentBin.serial = serial
            point.currentBin.size = size
        }
        await point.save();

        res.json(point);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// -- SOFT DELETE Point (status: deleted + history, ไม่ลบ doc จริง)
exports.deletePoint = async (req, res) => {
    try {
        const point = await GarbageBinPoint.findById(req.params.id);
        if (!point) return res.status(404).json({ error: "Not found" });

        // 1) เพิ่ม history
        point.history.push({
            bin: point.currentBin,
            action: "deleted",
            changeDate: new Date(),
            note: "ลบจุดติดตั้ง"
        });

        // 2) เปลี่ยน status bin เป็น deleted
        if (point.currentBin) {
            point.currentBin.status = "deleted";
        }

        // 3) (option) ลบรูปใน images ของจุด
        if (Array.isArray(point.images)) {
            await Promise.all(point.images.map(unlinkAsync));
            point.images = [];
        }

        await point.save();
        res.json({ message: "Soft deleted", id: point._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// -- เปลี่ยนสถานะถัง หรือ แจ้งเหตุการณ์ (เพิ่ม history ทุกครั้ง)
exports.changeBinStatus = async (req, res) => {
    try {
        const { action, status, serial, size, note } = req.body;
        const images = req.files ? req.files.map(f => '/uploads/garbage_bins/' + f.filename) : [];
        // action = "broken", "lost", "replaced", "installed", "removed"
        // status = "broken", "lost", "replaced", "active", "removed"
        const point = await GarbageBinPoint.findById(req.params.id);
        if (!point) return res.status(404).json({ error: "Not found" });

        if (action === "replaced") {
            // เปลี่ยนถังใหม่ สร้าง currentBin ใหม่
            const newBin = {
                serial,
                size: Number(size),
                status: "active",
                imageUrls: images,
                installedAt: new Date()
            };
            point.currentBin = newBin;
            point.history.push({
                bin: newBin,
                action: "replaced",
                changeDate: new Date(),
                note: note || "เปลี่ยนถังใหม่"
            });
        }
        else if (action === "removed") {
            point.currentBin.status = status;
            point.history.push({
                bin: { ...point.currentBin.toObject() }, // สำเนา bin ล่าสุด
                action,
                changeDate: new Date(),
                note: note || "นำถังขยะออก"
            });
            point.currentBin = null
        }
        else {
            // update สถานะถัง
            if (images)
                point.currentBin.imageUrls = images;

            point.currentBin.status = status;
            point.history.push({
                bin: { ...point.currentBin.toObject() }, // สำเนา bin ล่าสุด
                action,
                changeDate: new Date(),
                note: note || ""
            });
        }
        await point.save();
        res.json(point);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// -- GET Nearby Points
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
            },
            "currentBin.status": { $ne: "deleted" }
        });
        res.json(points);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
