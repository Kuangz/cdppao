// app.js
'use strict';
require('dotenv').config();
console.log('--- BACKEND STARTING --- MONGO_URI:', process.env.MONGO_URI?.split('@')[1] || 'NOT_SET');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const REQUIRED_ENVS = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = REQUIRED_ENVS.filter((k) => !process.env[k]);
if (missing.length) {
    console.error('Missing required env(s):', missing.join(', '));
    process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

// CORS
const whitelist = [
    'https://cdppao.phuketcity.go.th',
    'http://localhost:5173',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
];
const corsOptions = {
    origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (whitelist.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // Express 5 (path-to-regexp v6)

// Parsers
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// DB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.error('MongoDB connection error:', err?.message || err);
        process.exit(1);
    });

// Routes
const { authenticate } = require('./middleware/auth');

app.use('/api/auth', require('./routes/auth'));
app.get('/api/protected', authenticate, (req, res) => {
    res.json({
        message: 'This is a protected route',
        user: {
            id: String(req.user?._id || req.user?.id || ''),
            role: req.user?.role?.name || null,
            allowedLayerIds: req.allowedLayerIds || [],
        },
    });
});

app.use('/api/users', require('./routes/user'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/layers/upload', require('./routes/layerUpload'));
app.use('/api/layers', require('./routes/layers'));
app.use('/api/geoobjects', require('./routes/geoobjects'));

// Static uploads
app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'), { maxAge: '1d', etag: true, index: false })
);

// Health
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// 404
app.use((req, res, next) => {
    if (req.path.startsWith('/uploads/')) return next();
    res.status(404).json({ error: 'NOT_FOUND', path: req.originalUrl });
});

// Error handler
/* eslint-disable no-unused-vars */
app.use((err, req, res, _next) => {
    if (err && err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS_FORBIDDEN' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
});
/* eslint-enable no-unused-vars */

// Start
const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await mongoose.connection.close();
    process.exit(0);
});
