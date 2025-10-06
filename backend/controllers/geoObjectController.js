const GeoObject = require('../models/GeoObject');
const Layer = require('../models/Layer');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const UPLOAD_ROOT = 'uploads/geoobjects';
const toPosix = (p = '') => String(p).replace(/\\/g, '/');

const toStoredPath = (input = '') => {
    const clean = toPosix(input).trim();
    if (!clean) return '';
    const base = path.posix.basename(clean); // ป้องกัน traversal
    return `${UPLOAD_ROOT}/${base}`;
};

// ยืนยันว่าไฟล์อยู่ใต้ UPLOAD_ROOT ก่อนลบ (กัน path traversal)
const isSafeUnderUploadRoot = (p) => {
    const absRoot = path.resolve(UPLOAD_ROOT);
    const abs = path.resolve(p);
    return abs.startsWith(absRoot + path.sep) || abs === absRoot;
};


// parse JSON ปลอดภัย
const safeJSON = (raw, fallback = null) => { try { return JSON.parse(raw); } catch { return fallback; } };

// normalize array
const ensureArray = (v) => Array.isArray(v) ? v : (v != null ? [v] : []);

// Helper function to validate properties against a layer's field schema
const validateProperties = (properties, fields) => {
    for (const field of fields) {
        if (field.required && (properties[field.name] === undefined || properties[field.name] === null)) {
            throw new Error(`Property '${field.label}' is required.`);
        }
        if (properties[field.name] !== undefined) {
            let value = properties[field.name];
            switch (field.type) {
                case 'String':
                    if (typeof value !== 'string') throw new Error(`Property '${field.label}' must be a string.`);
                    break;
                case 'Number':
                    if (typeof value !== 'number') throw new Error(`Property '${field.label}' must be a number.`);
                    break;
                case 'Boolean':
                    if (typeof value !== 'boolean') throw new Error(`Property '${field.label}' must be a boolean.`);
                    break;
                case 'Date':
                    if (isNaN(Date.parse(value))) throw new Error(`Property '${field.label}' must be a valid date.`);
                    break;
                default:
                    throw new Error(`Unknown field type '${field.type}'.`);
            }
        }
    }
    // Check for extra properties that are not in the schema
    for (const propName in properties) {
        if (!fields.some(f => f.name === propName)) {
            throw new Error(`Property '${propName}' is not allowed in this layer.`);
        }
    }
};

// @desc    Create a new geo-object
// @route   POST /api/geoobjects
// @access  Authenticated Users
const createGeoObject = async (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
    }

    const { layerId } = req.body;
    const geometry = safeJSON(req.body.geometry);
    const properties = safeJSON(req.body.properties);

    if (!geometry || !properties) {
        return res.status(400).json({ error: 'Invalid JSON in geometry/properties.' });
    }

    try {
        const layer = await Layer.findById(layerId);
        if (!layer) return res.status(404).json({ error: 'Layer not found.' });

        if (layer.geometryType !== geometry.type) {
            throw new Error(`Invalid geometry type. Expected '${layer.geometryType}', but got '${geometry.type}'.`);
        }

        validateProperties(properties, layer.fields);

        // ⬇️ เอาเฉพาะไฟล์ใหม่ที่อัปโหลด
        const uploaded = (req.files || []).map(f => toStoredPath(f.path));

        const initialState = { properties, geometry, images: uploaded };

        const geoObject = new GeoObject({
            layerId,
            geometry,
            properties,
            images: uploaded,
            status: 'active',
            history: [{
                action: 'created',
                userId: req.user.id,
                diff: { before: null, after: initialState },
                changedAt: new Date()
            }]
        });

        const created = await geoObject.save();
        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get all geo-objects for a specific layer
// @route   GET /api/geoobjects?layerId=:layerId
// @access  Authenticated Users
const getGeoObjectsByLayer = async (req, res) => {
    try {
        const { layerId } = req.query;
        if (!layerId) {
            return res.status(400).json({ error: 'layerId query parameter is required.' });
        }
        // Only return active objects
        const objects = await GeoObject.find({ layerId: layerId, status: 'active' });
        res.json(objects);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get a single geo-object by ID
// @route   GET /api/geoobjects/:id
// @access  Authenticated Users
const getGeoObjectById = async (req, res) => {
    try {
        const geoObject = await GeoObject.findById(req.params.id).populate('layerId', 'name');

        // Do not return deleted objects, and only populate history for active objects
        if (geoObject && geoObject.status !== 'deleted') {
            // Safely populate history only for the object we intend to return
            await geoObject.populate('history.userId', 'username');
            res.json(geoObject);
        } else {
            res.status(404).json({ error: 'Geo-object not found' });
        }
    } catch (error) {
        console.error("Error in getGeoObjectById:", error); // Log the actual error for debugging
        res.status(500).json({ error: 'Server error' });
    }
};



// @desc    Update a geo-object
// @route   PUT /api/geoobjects/:id
// @access  Authenticated Users
const updateGeoObject = async (req, res) => {
    try {
        if (req.fileValidationError) {
            return res.status(400).json({ error: req.fileValidationError });
        }

        const geoObject = await GeoObject.findById(req.params.id);
        if (!geoObject) return res.status(404).json({ error: 'Geo-object not found' });

        const layer = await Layer.findById(geoObject.layerId);
        if (!layer) return res.status(404).json({ error: 'Associated layer not found.' });

        const oldState = {
            properties: JSON.parse(JSON.stringify(geoObject.properties)),
            geometry: JSON.parse(JSON.stringify(geoObject.geometry)),
            images: [...geoObject.images]
        };

        // properties
        if (req.body.properties) {
            const parsed = safeJSON(req.body.properties);
            if (!parsed) throw new Error('Invalid JSON in properties.');
            validateProperties(parsed, layer.fields);
            geoObject.properties = parsed;
        }

        // geometry
        if (req.body.geometry) {
            const parsed = safeJSON(req.body.geometry);
            if (!parsed) throw new Error('Invalid JSON in geometry.');
            if (layer.geometryType !== parsed.type) {
                throw new Error(`Invalid geometry type. Expected '${layer.geometryType}', but got '${parsed.type}'.`);
            }
            geoObject.geometry = parsed;
        }

        // ===== รูปภาพ =====
        const uploaded = (req.files || []).map(f => toStoredPath(f.path));

        // กรณี “ไม่ส่ง existingImages” และ “ไม่มีไฟล์ใหม่”
        // → ไม่แตะ images เลย (ป้องกันรูปเดิมหาย)
        const existingRaw = req.body.existingImages;
        const hasExistingParam = Object.prototype.hasOwnProperty.call(req.body, 'existingImages');
        let existing = [];

        if (hasExistingParam) {
            if (Array.isArray(existingRaw)) {
                existing = existingRaw;
            } else if (typeof existingRaw === 'string') {
                const s = existingRaw.trim();
                if (!s) {
                    existing = []; // สัญญาณ "ไม่มีรูปเหลือ"
                } else if (s.startsWith('[')) {
                    // เผื่ออนาคตฟรอนต์ส่ง JSON มาทีเดียว
                    try { existing = JSON.parse(s) || []; } catch { existing = [s]; }
                } else {
                    existing = [s];
                }
            }
            // normalize -> uploads/geoobjects/<basename> และเก็บไว้เฉพาะที่เคยมีจริง
            const oldSet = new Set(oldState.images.map(toPosix));
            existing = existing
                .map(toPosix)
                .map(toStoredPath)
                .filter(p => oldSet.has(p));
        }

        if (!hasExistingParam && uploaded.length === 0) {
            // images คงเดิม
        } else {
            // มี existingImages หรือมีไฟล์ใหม่ → ประมวลผลใหม่ทั้งหมด
            let existing = ensureArray(existingRaw)
                .map(toPosix)
                .map(toStoredPath);

            // กันกรณีส่งค่าประหลาดมา: เก็บเฉพาะที่ “เคยอยู่จริง” ใน DB เดิม
            const oldSet = new Set(oldState.images.map(toPosix));
            existing = existing.filter(p => oldSet.has(p));

            // final images = existing (ที่เหลือไว้) + uploaded (ไฟล์ใหม่)
            const finalImages = Array.from(new Set([...(existing || []), ...uploaded]));

            // ลบเฉพาะที่เคยมี แต่ไม่อยู่ใน final
            const toDelete = oldState.images.filter(img => !finalImages.includes(img));
            toDelete.forEach(rel => {
                const abs = path.resolve(rel);
                if (isSafeUnderUploadRoot(abs)) {
                    fs.unlink(abs, err => { if (err) console.error(`Failed to delete image: ${rel}`, err); });
                }
            });

            geoObject.images = finalImages; // <<== ถ้า existing ว่างและไม่มี uploaded จะเหลือ []
        }

        const newState = {
            properties: geoObject.properties,
            geometry: geoObject.geometry,
            images: geoObject.images
        };

        geoObject.history.push({
            action: 'updated',
            userId: req.user.id,
            diff: { before: oldState, after: newState },
            changedAt: new Date()
        });

        const updated = await geoObject.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// @desc    Delete a geo-object (soft delete)
// @route   DELETE /api/geoobjects/:id
// @access  Authenticated Users
const deleteGeoObject = async (req, res) => {
    try {
        const geoObject = await GeoObject.findById(req.params.id);
        if (!geoObject) {
            return res.status(404).json({ error: 'Geo-object not found' });
        }

        if (geoObject.status === 'deleted') {
            return res.status(400).json({ error: 'Geo-object is already deleted' });
        }

        geoObject.status = 'deleted';
        geoObject.history.push({
            action: 'deleted',
            userId: req.user.id,
            changedAt: new Date()
        });

        await geoObject.save();
        res.json({ message: 'Geo-object marked as deleted' });

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports = {
    createGeoObject,
    getGeoObjectsByLayer,
    getGeoObjectById,
    updateGeoObject,
    deleteGeoObject
};
