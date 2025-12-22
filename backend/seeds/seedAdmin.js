// seeds/seedAdmin.js
'use strict';
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');

const {
    MONGO_URI,
    ADMIN_USERNAME = 'admin',
    ADMIN_PASSWORD = 'ChangeMe123!',
    ADMIN_DISPLAY_NAME = 'System Admin',
    ADMIN_FORCE_RESET = '0',
} = process.env;

if (!MONGO_URI) {
    console.error('Missing MONGO_URI in .env');
    process.exit(1);
}

const ADMIN_GLOBAL_ACTIONS = [
    'users:list', 'users:read', 'users:create', 'users:update', 'users:delete',
    'roles:list', 'roles:read', 'roles:create', 'roles:update', 'roles:delete',
    'layers:list', 'layers:read', 'layers:create', 'layers:update', 'layers:delete',
    'geoobjects:list', 'geoobjects:read', 'geoobjects:create', 'geoobjects:update', 'geoobjects:delete',
];

async function upsertAdminRole() {
    let role = await Role.findOne({ name: 'admin' });
    if (!role) {
        role = await Role.create({ name: 'admin', permissions: [], globalActions: ADMIN_GLOBAL_ACTIONS });
        console.log('✔ Created role: admin');
    } else {
        const merged = new Set([...(role.globalActions || []), ...ADMIN_GLOBAL_ACTIONS]);
        role.globalActions = Array.from(merged);
        await role.save();
        console.log('✔ Ensured role: admin (globalActions up-to-date)');
    }
    return role;
}

async function upsertAdminUser(adminRole) {
    let user = await User.findOne({ username: ADMIN_USERNAME }).populate('role');

    if (!user) {
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
        user = await User.create({
            username: ADMIN_USERNAME,
            displayName: ADMIN_DISPLAY_NAME,
            password: ADMIN_PASSWORD,
            role: adminRole._id,
            status: 'active',
        });
        console.log(`✔ Created admin user: ${user.username}`);
        return user;
    }

    let changed = false;
    console.log(ADMIN_FORCE_RESET)
    if (String(user.role?._id) !== String(adminRole._id)) { user.role = adminRole._id; changed = true; }
    if (ADMIN_FORCE_RESET === '1') { user.password = ADMIN_PASSWORD; changed = true; }
    if (user.displayName !== ADMIN_DISPLAY_NAME) { user.displayName = ADMIN_DISPLAY_NAME; changed = true; }
    if (user.status !== 'active') { user.status = 'active'; changed = true; }

    if (changed) { await user.save(); console.log(`✔ Ensured admin user up-to-date: ${user.username}`); }
    else { console.log(`✔ Admin user already present: ${user.username}`); }

    return user;
}

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');
        const adminRole = await upsertAdminRole();
        const adminUser = await upsertAdminUser(adminRole);
        console.log('--- Seed Result ---');
        console.log('Role:', { id: String(adminRole._id), name: adminRole.name });
        console.log('User:', { id: String(adminUser._id), username: adminUser.username });
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Seed admin error:', err);
        process.exit(1);
    }
})();
