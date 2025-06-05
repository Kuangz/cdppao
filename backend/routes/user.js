const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// -- All routes require admin
router.use(auth, isAdmin);

router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.put("/:id/reset-password", userController.resetPassword);
router.get("/:id", userController.getUserById); // optional

module.exports = router;
