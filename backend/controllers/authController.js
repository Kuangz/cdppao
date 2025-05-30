const User = require('../models/User');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');


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
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

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
    res.json({ accessToken, username: user.username, role: user.role });
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