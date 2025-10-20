const Role = require('../models/Role');
const Layer = require('../models/Layer');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate('permissions.layer', 'name');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private/Admin
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions.layer', 'name');
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a role
// @route   POST /api/roles
// @access  Private/Admin
exports.createRole = async (req, res) => {
  const { name, permissions } = req.body;

  try {
    const roleExists = await Role.findOne({ name });
    if (roleExists) {
      return res.status(400).json({ message: 'Role already exists' });
    }

    const role = new Role({
      name,
      permissions,
    });

    const createdRole = await role.save();
    res.status(201).json(createdRole);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Private/Admin
exports.updateRole = async (req, res) => {
  const { name, permissions } = req.body;

  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    role.name = name || role.name;
    role.permissions = permissions || role.permissions;

    const updatedRole = await role.save();
    res.json(updatedRole);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Optional: Check if any user is assigned to this role before deletion

    await role.remove();
    res.json({ message: 'Role removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};
