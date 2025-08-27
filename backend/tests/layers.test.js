const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = 'jsonwebtoken'; // Not importing, just a placeholder for mock
const Layer = require('../models/Layer');
const layerRoutes = require('../routes/layers');
const authMiddleware = require('../middleware/auth');
const isAdminMiddleware = require('../middleware/isAdmin');

// Mocking middleware
jest.mock('../middleware/auth', () => jest.fn((req, res, next) => {
    // default to a regular user
    req.user = { id: 'userId', role: 'user' };
    if (req.headers.authorization === 'Bearer admin_token') {
        req.user = { id: 'adminId', role: 'admin' };
    }
    next();
}));

jest.mock('../middleware/isAdmin', () => jest.fn((req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Forbidden: Admins only" });
    }
}));

const app = express();
app.use(express.json());
app.use('/api/layers', layerRoutes);


describe('Layer API Endpoints', () => {
    beforeAll(async () => {
        // The in-memory MongoDB is handled by jest-mongodb preset
        await mongoose.connect(process.env.MONGO_URL);
    });

    afterEach(async () => {
        await Layer.deleteMany();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('POST /api/layers', () => {
        it('should create a new layer for an admin user', async () => {
            const res = await request(app)
                .post('/api/layers')
                .set('Authorization', 'Bearer admin_token')
                .send({
                    name: 'Test Layer',
                    geometryType: 'Point',
                    fields: [{ name: 'test_field', label: 'Test Field', type: 'String' }]
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('name', 'Test Layer');
        });

        it('should return 403 for a non-admin user', async () => {
            const res = await request(app)
                .post('/api/layers')
                .set('Authorization', 'Bearer user_token') // Regular user token
                .send({
                    name: 'Test Layer',
                    geometryType: 'Point'
                });
            expect(res.statusCode).toEqual(403);
        });
    });

    describe('GET /api/layers', () => {
        it('should return all layers for any authenticated user', async () => {
            await Layer.create({ name: 'Layer 1', geometryType: 'Point' });
            await Layer.create({ name: 'Layer 2', geometryType: 'Polygon' });

            const res = await request(app)
                .get('/api/layers')
                .set('Authorization', 'Bearer user_token');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(2);
        });
    });

    describe('DELETE /api/layers/:id', () => {
        it('should delete a layer for an admin user', async () => {
            const layer = await Layer.create({ name: 'ToDelete', geometryType: 'Point' });

            const res = await request(app)
                .delete(`/api/layers/${layer._id}`)
                .set('Authorization', 'Bearer admin_token');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Layer removed successfully');

            const foundLayer = await Layer.findById(layer._id);
            expect(foundLayer).toBeNull();
        });

        it('should return 403 for a non-admin trying to delete a layer', async () => {
            const layer = await Layer.create({ name: 'ProtectedLayer', geometryType: 'Point' });

            const res = await request(app)
                .delete(`/api/layers/${layer._id}`)
                .set('Authorization', 'Bearer user_token');

            expect(res.statusCode).toEqual(403);
        });
    });
});
