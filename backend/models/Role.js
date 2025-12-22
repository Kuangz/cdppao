// models/Role.js
'use strict';

const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    layer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Layer',
      required: true,
    },
    actions: [
      {
        type: String,
        // มาตรฐานเดียวกับ middleware: read|create|update|delete
        // ถ้าต้องการแยก 'upload' ก็เติมได้
        enum: ['read', 'create', 'update', 'delete', 'upload'],
        required: true,
      },
    ],
  },
  { _id: false }
);

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    // per-layer permissions
    permissions: [permissionSchema],
    // global (เช่น 'users:create', 'roles:list', 'layers:create' ...)
    globalActions: [{ type: String }],
  },
  { timestamps: true }
);

RoleSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Role', RoleSchema);
