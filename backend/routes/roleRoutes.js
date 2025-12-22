// routes/roleRoutes.js
'use strict';
const express = require('express');
const router = express.Router();

const { getRoles, getRoleById, createRole, updateRole, deleteRole } = require('../controllers/roleController');
const { authenticate, hasGlobal } = require('../middleware/auth');

router.use(authenticate);

router.get('/', hasGlobal('roles:list'), getRoles);
router.post('/', hasGlobal('roles:create'), createRole);
router.get('/:id', hasGlobal('roles:read'), getRoleById);
router.put('/:id', hasGlobal('roles:update'), updateRole);
router.delete('/:id', hasGlobal('roles:delete'), deleteRole);

module.exports = router;
