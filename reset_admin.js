import models from './src/models/index.js';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
    try {
        const adminEmail = 'admin@cronos.com';
        const admin = await models.Admin.findOne({ where: { email: adminEmail } });

        if (admin) {
            console.log('Found admin, resetting password to admin123...');
            admin.password = 'admin123';
            await admin.save();
            console.log('Password updated. Hashing handled by model hooks.');
        } else {
            console.log('Admin not found.');
        }
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

resetAdmin();
