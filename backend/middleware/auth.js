const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.user = {
            id: decoded.userId,
            username: decoded.username,
            role: decoded.role        // << เพิ่มตรงนี้
        };
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
