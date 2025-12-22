// routes/layerUpload.js
const express = require('express');
const router = express.Router();

const { uploadGeoJsonToLayer } = require('../controllers/layerController');
const { authenticate, hasPermission } = require('../middleware/auth');
const uploadGeojson = require('../middleware/uploadGeojson');

// อัปโหลดไฟล์ GeoJSON เข้าเลเยอร์ที่ระบุด้วย :id
// เงื่อนไขสิทธิ์:
// - admin ผ่านอัตโนมัติ (เช็คใน authenticate -> role.name === 'admin')
// - หรือมีสิทธิ์ 'update' บน Layer เป้าหมาย (resource-scoped)
// ลำดับ: auth -> permission -> multer(single) -> controller
router.post(
    '/:id',
    authenticate,
    hasPermission('update', 'Layer', { paramNames: ['id'] }),
    uploadGeojson.single('file'),
    uploadGeoJsonToLayer
);

module.exports = router;
