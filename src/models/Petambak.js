import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const Petambak = sequelize.define('Petambak', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    nik: {
        type: DataTypes.STRING,
        allowNull: true
    },
    npwp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    foto_ktp: {
        type: DataTypes.STRING, // Path to file
        allowNull: true
    },
    foto_tambak: {
        type: DataTypes.STRING, // Path to file
        allowNull: true
    },
    bank_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bank_account_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bank_account_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profile_photo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    etalase_photo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending' // pending, approved, rejected, suspended
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true // Store extra info like IP, device, etc.
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

Petambak.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export default Petambak;
