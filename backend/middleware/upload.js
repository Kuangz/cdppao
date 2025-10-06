// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const DEST = 'uploads/geoobjects';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });
        cb(null, DEST);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname || '').toLowerCase();
        cb(null, `images-${unique}${ext}`);
    }
});

// ใช้ MIME เป็นหลัก (รองรับ jpeg/png/webp/gif)
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const fileFilter = (req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
        req.fileValidationError = 'Only JPEG/PNG/WebP/GIF images are allowed!';
        return cb(null, false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
