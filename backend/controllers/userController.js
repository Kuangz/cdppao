// controllers/userController.js
'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');

// helper: สร้าง regex จาก search string (case-insensitive)
const makeRegex = (s = '') =>
    new RegExp(String(s).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

// GET /users?search=&page=1&pageSize=10&status=active
exports.getUsers = async (req, res) => {
    try {
        const {
            search = '',
            page = 1,
            pageSize = 10,
            status,
        } = req.query || {};

        const p = Math.max(1, parseInt(page, 10) || 1);
        const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10));

        const filter = {};
        if (search) {
            const rx = makeRegex(search);
            filter.$or = [{ username: rx }, { displayName: rx }];
        }
        if (status) filter.status = status; // 'active' | 'disabled' | 'deleted' (ตามที่ schema คุณรองรับ)

        const query = User.find(filter)
            .select('-password -passwordChangedAt')
            .populate('role', 'name')
            .sort({ createdAt: -1 })
            .skip((p - 1) * ps)
            .limit(ps)
            .lean();

        const [items, total] = await Promise.all([
            query,
            User.countDocuments(filter),
        ]);

        res.json({
            data: items,
            total,
            page: p,
            pageSize: ps,
        });
    } catch (err) {
        res.status(500).json({ error: err?.message || 'Server error' });
    }
};

// GET /users/:id
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -passwordChangedAt')
            .populate('role', 'name')
            .lean();
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err?.message || 'Bad request' });
    }
};

// POST /users
exports.createUser = async (req, res) => {
    try {
        const { username, password, displayName, role } = req.body || {};
        if (!username || !password || !displayName) {
            return res.status(400).json({ error: 'Username/Password/DisplayName required' });
        }

        // แนะนำให้มี unique index ที่ model ด้วย
        const exist = await User.findOne({ username });
        if (exist) return res.status(400).json({ error: 'Username already exists' });

        let roleId = undefined;
        if (role) {
            const roleDoc = await Role.findById(role);
            if (!roleDoc) return res.status(400).json({ error: 'Invalid role' });
            roleId = roleDoc._id;
        }

        // ปล่อยให้ pre-save hook ของ User ทำการ hash password เอง
        const user = await User.create({
            username,
            password,      // plain -> schema pre-save จะ hash ให้
            displayName,
            role: roleId,
            status: 'active',
        });

        res.status(201).json({ id: String(user._id) });
    } catch (err) {
        res.status(400).json({ error: err?.message || 'Bad request' });
    }
};

// PUT /users/:id
exports.updateUser = async (req, res) => {
    try {
        const { displayName, role, status, password } = req.body || {};
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (displayName != null) user.displayName = displayName;
        if (status != null) user.status = status;

        if (role) {
            if (!mongoose.Types.ObjectId.isValid(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }
            const roleDoc = await Role.findById(role);
            if (!roleDoc) return res.status(400).json({ error: 'Invalid role' });
            user.role = roleDoc._id;
        }

        if (password) {
            // ปล่อยให้ pre-save hook hash (อย่า hash ที่นี่เพื่อเลี่ยง double-hash)
            user.password = password;
        }

        await user.save();
        res.json({ message: 'Updated' });
    } catch (err) {
        res.status(400).json({ error: err?.message || 'Bad request' });
    }
};

// DELETE /users/:id
exports.deleteUser = async (req, res) => {
    try {
        // ทางเลือก A: ลบจริง (ตามเดิม)
        // const user = await User.findByIdAndDelete(req.params.id);

        // ทางเลือก B (แนะนำ): soft delete
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.status = 'deleted';
        await user.save();

        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(400).json({ error: err?.message || 'Bad request' });
    }
};

// PUT /users/:id/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body || {};
        if (!newPassword) return res.status(400).json({ error: 'newPassword required' });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // ปล่อยให้ pre-save hook hash
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset' });
    } catch (err) {
        res.status(400).json({ error: err?.message || 'Bad request' });
    }
};
