const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Layer = require('../models/Layer');
const GeoObject = require('../models/GeoObject');
const geoObjectRoutes = require('../routes/geoobjects');

const { authenticate, hasPermission } = require('../middleware/auth');
const { checkGeoObjectPermission } = require('../middleware/geoObjectPermission');

// Mocking the new middleware
const mockTestLayerId = new mongoose.Types.ObjectId();
jest.mock('../middleware/auth', () => ({
    authenticate: jest.fn((req, res, next) => {
        req.user = {
            id: 'userId',
            role: {
                name: 'user',
                permissions: [
                    { layer: { _id: mockTestLayerId }, actions: ['view', 'create', 'edit', 'delete'] },
                ]
            }
        };
        next();
    }),
    hasPermission: jest.fn((action, resourceType) => (req, res, next) => {
        next();
    }),
}));

jest.mock('../middleware/geoObjectPermission', () => ({
    checkGeoObjectPermission: jest.fn((action) => async (req, res, next) => {
        const GeoObject = require('../models/GeoObject'); // Require inside mock
        const { user } = req;
        if (!user || !user.role) return res.status(403).json({ error: 'Forbidden' });
        if (user.role.name === 'admin') return next();

        let layerId;
        if (req.method === 'POST') {
            layerId = req.body.layerId;
        } else if (req.query.layerId) {
            layerId = req.query.layerId;
        } else if (req.params.id) {
            const geoObject = await GeoObject.findById(req.params.id);
            if (geoObject) {
                layerId = geoObject.layerId.toString();
            }
        }

        if (!layerId) return res.status(400).json({ error: 'Layer ID missing' });

        const hasPerm = user.role.permissions.some(p => p.layer._id.toString() === layerId && p.actions.includes(action));

        if (hasPerm) {
            next();
        } else {
            res.status(403).json({ error: 'Forbidden' });
        }
    }),
}));


const app = express();
app.use(express.json());
app.use('/api/geoobjects', geoObjectRoutes);

describe('GeoObject API Endpoints with History and Soft Delete', () => {
    let testLayer;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL);
    });

    beforeEach(async () => {
        // Create a sample layer before each test
        testLayer = await Layer.create({
            _id: mockTestLayerId,
            name: 'Test Point Layer',
            geometryType: 'Point',
            fields: [
                { name: 'name', label: 'Name', type: 'String', required: true },
            ]
        });
    });

    afterEach(async () => {
        await Layer.deleteMany();
        await GeoObject.deleteMany();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('POST /api/geoobjects', () => {
        it('should create a new geo-object with active status and creation history', async () => {
            const geometry = { type: 'Point', coordinates: [100, 10] };
            const properties = { name: 'Valid Point' };

            const res = await request(app)
                .post('/api/geoobjects')
                .field('layerId', testLayer._id.toString())
                .field('geometry', JSON.stringify(geometry))
                .field('properties', JSON.stringify(properties));

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('layerId', testLayer._id.toString());
            expect(res.body.properties).toEqual(properties);
            expect(res.body.status).toBe('active'); // Test for soft delete status
            expect(res.body.history).toHaveLength(1); // Test for history
            expect(res.body.history[0].action).toBe('created');
            expect(res.body.history[0].diff.after.properties).toEqual(properties);
        });

        // Validation tests remain relevant
        it('should fail if a required property is missing', async () => {
            const geometry = { type: 'Point', coordinates: [100, 10] };
            const properties = { rating: 3 }; // Missing 'name'

            const res = await request(app)
                .post('/api/geoobjects')
                .field('layerId', testLayer._id.toString())
                .field('geometry', JSON.stringify(geometry))
                .field('properties', JSON.stringify(properties));

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain("Property 'Name' is required.");
        });
    });

    describe('PUT /api/geoobjects/:id', () => {
        let existingObject;

        beforeEach(async () => {
            existingObject = await GeoObject.create({
                layerId: testLayer._id,
                geometry: { type: 'Point', coordinates: [0, 0] },
                properties: { name: 'Original Name' },
                status: 'active',
                history: []
            });
        });

        it('should update an object and record history', async () => {
            const updatedProperties = { name: 'Updated Name' };
            const res = await request(app)
                .put(`/api/geoobjects/${existingObject._id}`)
                .field('properties', JSON.stringify(updatedProperties));

            expect(res.statusCode).toBe(200);
            expect(res.body.properties.name).toBe('Updated Name');
            expect(res.body.history).toHaveLength(1);
            expect(res.body.history[0].action).toBe('updated');
            expect(res.body.history[0].diff.before.properties.name).toBe('Original Name');
            expect(res.body.history[0].diff.after.properties.name).toBe('Updated Name');
        });
    });


    describe('DELETE /api/geoobjects/:id', () => {
        let existingObject;

        beforeEach(async () => {
            existingObject = await GeoObject.create({
                layerId: testLayer._id,
                geometry: { type: 'Point', coordinates: [1, 1] },
                properties: { name: 'To Be Deleted' },
                status: 'active',
                history: []
            });
        });

        it('should soft delete an object and record history', async () => {
            const res = await request(app)
                .delete(`/api/geoobjects/${existingObject._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Geo-object marked as deleted');

            const dbObject = await GeoObject.findById(existingObject._id);
            expect(dbObject.status).toBe('deleted');
            expect(dbObject.history).toHaveLength(1);
            expect(dbObject.history[0].action).toBe('deleted');
        });
    });


    describe('GET /api/geoobjects', () => {
        it('should return only active objects', async () => {
            await GeoObject.create({
                layerId: testLayer._id,
                geometry: { type: 'Point', coordinates: [1, 1] },
                properties: { name: 'Active Point' },
                status: 'active'
            });
            await GeoObject.create({
                layerId: testLayer._id,
                geometry: { type: 'Point', coordinates: [2, 2] },
                properties: { name: 'Deleted Point' },
                status: 'deleted'
            });

            const res = await request(app)
                .get(`/api/geoobjects?layerId=${testLayer._id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].properties.name).toBe('Active Point');
        });
    });

    describe('GET /api/geoobjects/:id', () => {
        it('should return 404 for a soft-deleted object', async () => {
            const softDeletedObject = await GeoObject.create({
                layerId: testLayer._id,
                geometry: { type: 'Point', coordinates: [3, 3] },
                properties: { name: 'I am deleted' },
                status: 'deleted'
            });

            const res = await request(app)
                .get(`/api/geoobjects/${softDeletedObject._id}`);

            expect(res.statusCode).toEqual(404);
        });
    });
});