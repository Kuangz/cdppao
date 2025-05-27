const GarbageBinPoint = require("../models/GarbageBinPoint");

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

// -- CREATE
exports.createPoint = async (req, res) => {
    try {
        const { locationName, description, lat, lng, currentBin } = req.body;
        const images = req.files ? req.files.map(f => f.path) : [];
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

// -- UPDATE
exports.updatePoint = async (req, res) => {
    try {
        const { locationName, description, lat, lng, currentBin } = req.body;
        console.log(req.body)
        const images = req.files ? req.files.map(f => f.path) : [];
        const update = {
            ...(locationName && { locationName }),
            ...(description != undefined && { description }),
            ...(lat && lng ? { coordinates: { type: "Point", coordinates: [Number(lng), Number(lat)] } } : {}),
            ...(images.length ? { images } : {}),
            ...(currentBin ? { currentBin: JSON.parse(currentBin) } : {})
        };
        const point = await GarbageBinPoint.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!point) return res.status(404).json({ error: "Not found" });
        res.json(point);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// -- DELETE
exports.deletePoint = async (req, res) => {
    try {
        const point = await GarbageBinPoint.findByIdAndDelete(req.params.id);
        if (!point) return res.status(404).json({ error: "Not found" });
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
