// controllers/roleController.js
'use strict';

const Role = require('../models/Role');
const User = require('../models/User');

exports.getRoles = async (_req, res) => {
  const roles = await Role.find().lean();
  res.json(roles);
};

exports.getRoleById = async (req, res) => {
  const role = await Role.findById(req.params.id).lean();
  if (!role) return res.status(404).json({ message: 'Role not found' });
  res.json(role);
};

exports.createRole = async (req, res) => {
  try {
    const { name, permissions = [], globalActions = [] } = req.body || {};
    if (!name) return res.status(400).json({ message: 'name is required' });

    const exists = await Role.findOne({ name });
    if (exists) return res.status(409).json({ message: 'Role already exists' });
    console.log(permissions)
    const role = await Role.create({ name, permissions, globalActions });
    res.status(201).json(role);
  } catch (err) {
    res.status(400).json({ message: err?.message || 'Bad request' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { name, permissions, globalActions } = req.body || {};
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    if (name != null) role.name = name;
    if (permissions != null) role.permissions = permissions;
    if (globalActions != null) role.globalActions = globalActions;

    await role.save();
    res.json(role);
  } catch (err) {
    res.status(400).json({ message: err?.message || 'Bad request' });
  }
};

exports.deleteRole = async (req, res) => {
  const inUse = await User.exists({ role: req.params.id });
  if (inUse) return res.status(400).json({ message: 'Cannot delete role: in use by users' });

  const role = await Role.findByIdAndDelete(req.params.id);
  if (!role) return res.status(404).json({ message: 'Role not found' });
  res.json({ message: 'Role deleted' });
};
