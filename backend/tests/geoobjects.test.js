const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Layer = require('../models/Layer');
const GeoObject = require('../models/GeoObject');
const geoObjectRoutes = require('../routes/geoobjects');

// Mock middleware - all users are authenticated regular users
jest.mock('../middleware/auth', () => {
    const mongoose = require('mongoose'); // require inside the mock factory
    return jest.fn((req, res, next) => {
        req.user = { id: new mongoose.Types.ObjectId().toHexString(), role: 'user' };
        next();
    });
});

const app = express();
app.use(express.json());
app.use('/api/geoobjects', geoObjectRoutes);

describe('GeoObject API Endpoints', () => {
    let testLayer;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL);
    });

    beforeEach(async () => {
        // Create a sample layer before each test
        testLayer = await Layer.create({
            name: 'Test Point Layer',
            geometryType: 'Point',
            fields: [
                { name: 'name', label: 'Name', type: 'String', required: true },
                { name: 'rating', label: 'Rating', type: 'Number', required: false },
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
        it('should create a new geo-object with valid properties', async () => {
            const geometry = { type: 'Point', coordinates: [100, 10] };
            const properties = { name: 'Valid Point', rating: 5 };

            const res = await request(app)
                .post('/api/geoobjects')
                .field('layerId', testLayer._id.toString())
                .field('geometry', JSON.stringify(geometry))
                .field('properties', JSON.stringify(properties));

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('layerId', testLayer._id.toString());
            expect(res.body.properties).toEqual(properties);
        });

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

        it('should fail if a property has the wrong data type', async () => {
            const geometry = { type: 'Point', coordinates: [100, 10] };
            const properties = { name: 'Good Point', rating: 'five' }; // 'rating' should be a number

            const res = await request(app)
                .post('/api/geoobjects')
                .field('layerId', testLayer._id.toString())
                .field('geometry', JSON.stringify(geometry))
                .field('properties', JSON.stringify(properties));

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain("Property 'Rating' must be a number.");
        });

        it('should fail if geometry type does not match the layer', async () => {
            const geometry = { type: 'Polygon', coordinates: [[[0,0], [1,1], [0,1], [0,0]]] };
            const properties = { name: 'Wrong Geometry' };

            const res = await request(app)
                .post('/api/geoobjects')
                .field('layerId', testLayer._id.toString())
                .field('geometry', JSON.stringify(geometry))
                .field('properties', JSON.stringify(properties));

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain("Invalid geometry type. Expected 'Point', but got 'Polygon'.");
        });
    });

    describe('GET /api/geoobjects', () => {
        it('should return all objects for a given layerId', async () => {
            await GeoObject.create({
                layerId: testLayer._id,
                geometry: { type: 'Point', coordinates: [1, 1] },
                properties: { name: 'Point A' }
            });
             await GeoObject.create({
                layerId: testLayer._id,
                geometry: { type: 'Point', coordinates: [2, 2] },
                properties: { name: 'Point B' }
            });

            const res = await request(app)
                .get(`/api/geoobjects?layerId=${testLayer._id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(2);
        });
    });
});
