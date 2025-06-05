const express = require('express');
const { register, login, refreshToken, logout, changePassword } = require('../controllers/authController');
const isAdmin = require('../middleware/isAdmin');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', isAdmin, register);
router.post('/change-password', auth, changePassword);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

module.exports = router;
