const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = 'jsonwebtoken'; // Not importing, just a placeholder for mock
const Layer = require('../models/Layer');
const layerRoutes = require('../routes/layers');
const { authenticate, hasPermission } = require('../middleware/auth');

// Mocking the new middleware
// Mocking the new middleware
const mockLayer1Id = '507f1f77bcf86cd799439011';
jest.mock('../middleware/auth', () => ({
    authenticate: jest.fn((req, res, next) => {
        // Mock user population based on token
        if (req.headers.authorization === 'Bearer admin_token') {
            req.user = {
                id: 'adminId',
                role: {
                    name: 'admin',
                    permissions: [], // Admin doesn't need specific permissions
                    globalActions: ['layers:create', 'roles:create'] // Add global actions for admin
                }
            };
        } else if (req.headers.authorization === 'Bearer user_token') {
            req.user = {
                id: 'userId',
                role: {
                    name: 'user',
                    permissions: [
                        // Give user 'view' permission on a specific layer for testing GET
                        { layer: { _id: mockLayer1Id }, actions: ['view'] },
                        { layer: { _id: '507f1f77bcf86cd799439012' }, actions: ['create'] } // Random one
                    ]
                }
            };
        }
        next();
    }),
    hasPermission: jest.fn((action, resourceType) => (req, res, next) => {
        // Mock permission check
        const { user } = req;
        if (user && user.role.name === 'admin') {
            return next();
        }
        // Simplified check for tests
        if (action === 'view' && resourceType === 'Layer' && user.role.permissions.some(p => p.actions.includes('view'))) {
            return next();
        }
        if (action === 'create' || action === 'delete' || action === 'edit' || action === 'update') {
            // Basic deny for user unless specific
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    }),
    requireAny: jest.fn(() => (req, res, next) => next()),
    hasGlobal: jest.fn(() => (req, res, next) => {
        // Simple mock allowing admin
        if (req.user && req.user.role.name === 'admin') return next();
        return res.status(403).json({ error: 'Forbidden' });
    })
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
        it('should return only layers the user has permission to view', async () => {
            await Layer.create({ _id: mockLayer1Id, name: 'Layer 1', geometryType: 'Point' });
            await Layer.create({ _id: new mongoose.Types.ObjectId(), name: 'Layer 2', geometryType: 'Polygon' });

            const res = await request(app)
                .get('/api/layers')
                .set('Authorization', 'Bearer user_token');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe('Layer 1');
        });

        it('should return all layers for an admin user', async () => {
            await Layer.create({ name: 'Layer 1', geometryType: 'Point' });
            await Layer.create({ name: 'Layer 2', geometryType: 'Polygon' });

            const res = await request(app)
                .get('/api/layers')
                .set('Authorization', 'Bearer admin_token');

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
