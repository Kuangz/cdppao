const User = require('../models/User');
const bcrypt = require('bcrypt');

// GET /users?search=&page=1&pageSize=10
exports.getUsers = async (req, res) => {
    const { search = "", page = 1, pageSize = 10 } = req.query;
    const query = {};
    if (search) query.username = { $regex: search, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    const [items, total] = await Promise.all([
        User.find(query)
            .sort({ username: 1 })
            .skip(skip)
            .limit(parseInt(pageSize))
            .select("-password"), // hide password
        User.countDocuments(query)
    ]);
    res.json({
        items,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
    });
};


// POST /users
exports.createUser = async (req, res) => {
    try {
        const { username, password, displayName, role } = req.body;
        if (!username || !password || !displayName) {
            return res.status(400).json({ error: "Username/Password/DisplayName required" });
        }
        const exist = await User.findOne({ username });
        if (exist) return res.status(400).json({ error: "Username already exists" });

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hash, displayName, role: role || "user" });
        res.status(201).json({ message: "User created", id: user._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


// PUT /users/:id
exports.updateUser = async (req, res) => {
    try {
        const { role, displayName } = req.body;
        if (!role || !displayName) return res.status(400).json({ error: "Role and displayName are required" });

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role, displayName },
            { new: true }
        ).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User updated", user });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// DELETE /users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// PUT /users/:id/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "Password required (min 6 chars)" });
        }
        const hash = await bcrypt.hash(newPassword, 10);
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { password: hash },
            { new: true }
        ).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ message: "Password reset", user });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// GET /users/:id  (optional)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
