require('dotenv').config();
console.log('MONGO_URI:', process.env.MONGO_URI); // 👈 LOG HERE

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const garbageBinRoutes = require('./routes/garbageBinPoint.js');
const userRoutes = require("./routes/user.js")
const path = require("path")

const whitelist = [
    "http://localhost:3000",   // frontend local dev
    "https://yourdomain.com",
    "http://10.0.1.3:6066",   // เปลี่ยนเป็น domain จริงที่ต้องการ
    "https://whereisbin.phuketcity.go.th",
    "http://localhost:6066",
];
const corsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
};


const app = express();
app.set('trust proxy', 1)
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

if (!process.env.MONGO_URI) {
    console.error("No MONGO_URI in environment! Exiting.");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error(err));

app.use('/api/auth', require('./routes/auth'));

// Protected example route
const auth = require('./middleware/auth');
app.get('/api/protected', auth, (req, res) => {
    res.json({ message: 'This is a protected route', userId: req.userId });
});

const layerRoutes = require('./routes/layers.js');

app.use('/api/garbage-bins', garbageBinRoutes);
const geoObjectRoutes = require('./routes/geoobjects.js');

app.use('/api/users', userRoutes);
app.use('/api/layers', layerRoutes);
app.use('/api/geoobjects', geoObjectRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
