// routes/auth.js
'use strict';
const express = require('express');
const router = express.Router();

const { register, login, refreshToken, logout, changePassword } = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/register', authenticate, requireRole('admin'), register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, changePassword);
// routes/auth.js
router.get('/me', authenticate, (req, res) => {
    res.json({
        username: req.user.username,
        displayName: req.user.displayName,
        role: { name: req.user.role?.name, id: String(req.user.role?._id) },
    });
});

module.exports = router;
