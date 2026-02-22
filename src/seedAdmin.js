import sequelize from './config/database.js';
import models from './models/index.js';

const seedAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');

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
                password: 'admin123' // Akan di-hash oleh hooks
            });
            await Wallet.create({ owner_type: 'ADMIN', owner_id: newAdmin.id, balance: 0 });
            console.log('Default Admin created: admin@cronos.com / admin123');
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedAdmin();
