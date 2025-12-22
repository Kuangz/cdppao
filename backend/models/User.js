// models/User.js
'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, unique: true, required: true, index: true },
        password: { type: String, required: true },
        displayName: { type: String, required: true },
        role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
        status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    },
    { timestamps: true }
);

// แฮชเฉพาะตอนเปลี่ยน และยังไม่ใช่ bcrypt hash (ป้องกันแฮชซ้ำ)
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = new Date();
    next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
    console.log(candidatePassword)
    console.log(this.password)
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.set('toJSON', {
    transform: (_doc, ret) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
    },
});

module.exports = mongoose.model('User', UserSchema);
