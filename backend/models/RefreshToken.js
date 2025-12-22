// models/RefreshToken.js
'use strict';

const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        token: { type: String, unique: true, required: true },
        expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }, // TTL index
    },
    { timestamps: true }
);

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
