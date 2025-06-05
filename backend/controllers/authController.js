const User = require('../models/User');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcrypt');

const createAccessToken = (user) =>
    jwt.sign(
        { userId: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

const createRefreshToken = (user) =>
    jwt.sign(
        { userId: user._id, username: user.username, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

exports.register = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'ไม่พบชื่อผู้ใช้งาน' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง กรุณาลงชื่อเข้าใช้อีกครั้ง' });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // ⏩ เก็บ refreshToken ใน DB
    await RefreshToken.create({
        userId: user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 วัน
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน (ms)
    });
    res.json({
        accessToken,
        username: user.username,
        role: user.role,
        displayName: user.displayName
    });
};

exports.refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(403).json({ error: 'No refresh token' });

    const dbToken = await RefreshToken.findOne({ token: refreshToken });
    if (!dbToken) return res.status(403).json({ error: 'Invalid refresh token' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const accessToken = createAccessToken({
            _id: decoded.userId,
            username: decoded.username,
            role: decoded.role,
        });
        res.json({ accessToken });
    } catch (err) {
        return res.status(403).json({ error: 'Invalid refresh token' });
    }
};


exports.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshToken) {
        await RefreshToken.deleteOne({ token: refreshToken });
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
};

exports.changePassword = async (req, res) => {
    try {
        console.log(req.user)
        const userId = req.user.id; // มาจาก jwt middleware (decode แล้ว)
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) return res.status(400).json({ error: "รหัสผ่านเดิมไม่ถูกต้อง" });

        user.password = newPassword;
        await user.save();

        res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};
