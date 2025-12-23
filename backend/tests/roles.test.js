const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Role = require('../models/Role');
const roleRoutes = require('../routes/roleRoutes');

// Mocking middleware
jest.mock('../middleware/auth', () => ({
    authenticate: jest.fn((req, res, next) => {
        // Simulate admin user
        if (req.headers.authorization === 'Bearer admin_token') {
            req.user = {
                id: 'adminId',
                role: {
                    name: 'admin',
                    permissions: [],
                    globalActions: ['roles:create', 'roles:read', 'roles:update', 'roles:delete', 'roles:list']
                }
            };
        } else {
            // Simulate normal user without global permissions
            req.user = {
                id: 'userId',
                role: {
                    name: 'user',
                    permissions: [],
                    globalActions: []
                }
            };
        }
        next();
    }),
    hasGlobal: jest.fn((action) => (req, res, next) => {
        const { user } = req;
        if (user && user.role.globalActions && user.role.globalActions.includes(action)) {
            return next();
        }
        return res.status(403).json({ message: 'Forbidden' });
    }),
}));

const app = express();
app.use(express.json());
app.use('/api/roles', roleRoutes);

describe('Role API Endpoints', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL);
    });

    afterEach(async () => {
        await Role.deleteMany();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('POST /api/roles', () => {
        it('should create a new role successfully', async () => {
            const res = await request(app)
                .post('/api/roles')
                .set('Authorization', 'Bearer admin_token')
                .send({
                    name: 'Manager',
                    permissions: [],
                    globalActions: ['users:read']
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('name', 'Manager');
            expect(res.body.globalActions).toContain('users:read');
        });

        it('should return 400 if name is missing', async () => {
            const res = await request(app)
                .post('/api/roles')
                .set('Authorization', 'Bearer admin_token')
                .send({
                    globalActions: ['users:read']
                });
            expect(res.statusCode).toEqual(400);
        });

        it('should return 409 if role already exists', async () => {
            await Role.create({ name: 'DuplicateRole' });

            const res = await request(app)
                .post('/api/roles')
                .set('Authorization', 'Bearer admin_token')
                .send({
                    name: 'DuplicateRole'
                });
            expect(res.statusCode).toEqual(409);
        });
    });

    describe('GET /api/roles', () => {
        it('should list all roles', async () => {
            await Role.create({ name: 'Role1' });
            await Role.create({ name: 'Role2' });

            const res = await request(app)
                .get('/api/roles')
                .set('Authorization', 'Bearer admin_token');

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBe(2);
        });
    });
});
