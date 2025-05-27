const express = require('express');
const router = express.Router();
const garbageBinController = require('../controllers/garbageBinPointController');
const multer = require('multer');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
// ---- Multer Config สำหรับอัพโหลดรูป (ปรับ path ได้)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/garbage_bins/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get("/nearby", auth, garbageBinController.getNearbyPoints);

router.get('/', auth, garbageBinController.listPoints);
router.get('/:id', auth, garbageBinController.getPoint);

router.post('/', auth, upload.array('images', 10), garbageBinController.createPoint);
router.put('/:id', auth, upload.array('images', 10), garbageBinController.updatePoint);
router.delete('/:id', [auth, isAdmin], garbageBinController.deletePoint);

// เพิ่ม API สำหรับ add/change bin history
router.post('/:id/history', auth, garbageBinController.addBinHistory);

module.exports = router;
