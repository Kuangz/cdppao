const multer = require('multer');

const storage = multer.memoryStorage(); // Use memory storage for temporary file handling

const fileFilter = (req, file, cb) => {
    // Accept .kml files only
    if (!file.originalname.match(/\.(kml)$/i)) {
        req.fileValidationError = 'Only .kml files are allowed!';
        return cb(new Error('Only .kml files are allowed!'), false);
    }
    cb(null, true);
};

const uploadKml = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 10 } // 10MB file size limit for KML
});

module.exports = uploadKml;
