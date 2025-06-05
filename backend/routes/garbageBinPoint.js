const express = require('express');
const router = express.Router();
const garbageBinController = require('../controllers/garbageBinPointController');
const multer = require('multer');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const fs = require('fs');
const path = require('path');

// ---- Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'garbage_bins');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ---- Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// -- Geospatial (find nearby)
router.get("/nearby", auth, garbageBinController.getNearbyPoints);
router.get("/map", auth, garbageBinController.listPointsForMap);

// -- List all / get one
router.get('/', auth, garbageBinController.listPoints);
router.get('/:id', auth, garbageBinController.getPoint);

// -- Create / update point (info + images)
router.post('/', auth, upload.array('images', 10), garbageBinController.createPoint);
router.put('/:id', auth, upload.array('images', 10), garbageBinController.updatePoint);

// -- Soft delete (admin only)
router.delete('/:id', [auth, isAdmin], garbageBinController.deletePoint);

// -- เปลี่ยนสถานะถัง/แจ้งเหตุการณ์ทุกชนิด (action = broken/lost/replaced/installed/removed)
router.post('/:id/status', auth, upload.array('images', 5), garbageBinController.changeBinStatus);

module.exports = router;
