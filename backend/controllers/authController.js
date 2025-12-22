// controllers/authController.js
'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_TTL = process.env.ACCESS_TTL || '15m';
const REFRESH_TTL_MS = Number(process.env.REFRESH_TTL_MS || 7 * 24 * 60 * 60 * 1000);
const isProd = process.env.NODE_ENV === 'production';
const CROSS_SITE_COOKIES = process.env.CROSS_SITE_COOKIES === '1';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refreshToken';

const cookieOpts = () => ({
    httpOnly: true,
    secure: CROSS_SITE_COOKIES ? true : isProd,
    sameSite: CROSS_SITE_COOKIES ? 'none' : 'lax',
    path: '/api/auth/refresh',
    maxAge: REFRESH_TTL_MS,
});
const clearCookieOpts = () => ({
    httpOnly: true,
    secure: CROSS_SITE_COOKIES ? true : isProd,
    sameSite: CROSS_SITE_COOKIES ? 'none' : 'lax',
    path: '/api/auth/refresh',
});

const createAccessToken = (user) =>
    jwt.sign(
        { userId: String(user._id), username: user.username, roleId: String(user.role?._id || user.role) },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TTL }
    );

const createRefreshToken = (user) =>
    jwt.sign(
        { userId: String(user._id), username: user.username, roleId: String(user.role?._id || user.role) },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: Math.floor(REFRESH_TTL_MS / 1000) }
    );

const persistRefresh = (userId, token) =>
    RefreshToken.create({ userId, token, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) });

exports.register = async (req, res) => {
    try {
        const exists = await User.findOne({ username: req.body.username });
        if (exists) return res.status(409).json({ error: 'Username already exists' });

        const user = new User(req.body);
        await user.save();
        res.status(201).json({ message: 'User created', id: String(user._id) });
    } catch (err) {
        res.status(400).json({ error: err?.message || 'Bad request' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });

        const user = await User.findOne({ username }).populate({
            path: 'role',
            populate: { path: 'permissions.layer', select: 'name' },
        });
        if (!user) return res.status(401).json({ error: 'ไม่พบชื่อผู้ใช้งาน' });

        const ok = await user.comparePassword(password);
        if (!ok) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง กรุณาลงชื่อเข้าใช้อีกครั้ง' });

        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshToken(user);

        await persistRefresh(user._id, refreshToken);
        res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOpts());

        res.json({
            accessToken,
            username: user.username,
            role: user.role,
            displayName: user.displayName,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
        if (!token) return res.status(403).json({ error: 'No refresh token' });

        const dbToken = await RefreshToken.findOne({ token });
        if (!dbToken) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
                await RefreshToken.deleteMany({ userId: decoded.userId });
            } catch (_) { }
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        await RefreshToken.deleteOne({ _id: dbToken._id });

        const user = await User.findById(decoded.userId).populate({
            path: 'role',
            populate: { path: 'permissions.layer', select: 'name' },
        });
        if (!user) return res.status(403).json({ error: 'Invalid refresh token' });

        const newAccess = createAccessToken(user);
        const newRefresh = createRefreshToken(user);
        await persistRefresh(user._id, newRefresh);

        res.cookie(REFRESH_COOKIE_NAME, newRefresh, cookieOpts());
        res.json({ accessToken: newAccess });
    } catch (err) {
        console.error('Refresh error:', err?.message || err);
        res.status(403).json({ error: 'Invalid refresh token' });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
        if (token) await RefreshToken.deleteOne({ token });
        res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOpts());
        res.json({ message: 'Logged out' });
    } catch (err) {
        res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOpts());
        res.json({ message: 'Logged out' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = String(req.user?._id || req.user?.id || '');
        const { oldPassword, newPassword } = req.body || {};

        if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
        if (!oldPassword || !newPassword) return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });

        const ok = await user.comparePassword(oldPassword);
        if (!ok) return res.status(400).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });

        user.password = newPassword; // hashed by pre-save
        await user.save();

        await RefreshToken.deleteMany({ userId });

        res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (err) {
        console.error('changePassword error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
