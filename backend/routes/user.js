// routes/user.js
'use strict';
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

// admin only
router.use(authenticate, requireRole('admin'));

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/reset-password', userController.resetPassword);
router.get('/:id', userController.getUserById);

module.exports = router;
