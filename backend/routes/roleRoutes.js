const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} = require('../controllers/roleController');
const { hasPermission } = require('../middleware/auth'); // Assuming a general permission middleware

// For all routes, only admins can manage roles.
// The specific 'admin' string might be replaced by a more robust check later.
router.use(hasPermission('admin'));

router.route('/').get(getRoles).post(createRole);
router.route('/:id').get(getRoleById).put(updateRole).delete(deleteRole);

module.exports = router;
