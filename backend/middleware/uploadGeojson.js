const multer = require('multer');

const storage = multer.memoryStorage(); // Use memory storage for temporary file handling

const fileFilter = (req, file, cb) => {
    // Accept .geojson or .json files
    if (!file.originalname.match(/\.(geojson|json)$/i)) {
        req.fileValidationError = 'Only .geojson or .json files are allowed!';
        return cb(new Error('Only .geojson or .json files are allowed!'), false);
    }
    cb(null, true);
};

const uploadGeojson = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 40 } // 10MB file size limit
});

module.exports = uploadGeojson;
