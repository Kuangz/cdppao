const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  layer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Layer',
    required: true,
  },
  actions: [{
    type: String,
    enum: ['view', 'create', 'edit', 'delete'],
    required: true,
  }],
}, { _id: false });

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  permissions: [permissionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
