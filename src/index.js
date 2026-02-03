import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import sequelize from './config/database.js';
import models from './models/index.js'; // Trigger association loading

import authRoutes from './routes/authRoutes.js';
import tambakRoutes from './routes/tambakRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import walletRoutes from './routes/walletRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tambak', tambakRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/', (req, res) => {
    res.send('CRONOS Backend is running');
});



// Sync Database and Start Server
const PORT = process.env.PORT || 9000;

sequelize.sync({ alter: true })
    .then(async () => {
        console.log('Database synced successfully.');

        // Seed Admin Logic
        try {
            const { Admin, Wallet } = models;
            const adminEmail = 'admin@cronos.com';
            const existingAdmin = await Admin.findOne({ where: { email: adminEmail } });

            if (existingAdmin) {
                const wallet = await Wallet.findOne({ where: { owner_type: 'ADMIN', owner_id: existingAdmin.id } });
                if (!wallet) {
                    await Wallet.create({ owner_type: 'ADMIN', owner_id: existingAdmin.id, balance: 0 });
                    console.log('Admin wallet created for existing admin.');
                } else {
                    console.log('Admin and wallet already exist.');
                }
            } else {
                console.log('Admin not found. Creating default admin...');
                const newAdmin = await Admin.create({
                    name: 'Super Admin',
                    email: adminEmail,
                    password: 'admin123' // Will be hashed by hooks
                });
                await Wallet.create({ owner_type: 'ADMIN', owner_id: newAdmin.id, balance: 0 });
                console.log('Default Admin created: admin@cronos.com / admin123');
            }
        } catch (error) {
            console.error('Seeding failed:', error);
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to sync database:', err);
    });

export default app;
