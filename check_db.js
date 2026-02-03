import models from './src/models/index.js';

async function checkAdmin() {
    try {
        const admins = await models.Admin.findAll();
        console.log('Admins in DB:', admins.map(a => ({ id: a.id, email: a.email, name: a.name, pass_prefix: a.password.substring(0, 7) })));
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkAdmin();
