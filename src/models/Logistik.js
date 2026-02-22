import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const Logistik = sequelize.define('Logistik', {
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
    vehicle_type: {
        type: DataTypes.STRING, // e.g., 'Truck', 'Van'
        allowNull: true
    },
    license_plate: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profile_photo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    vehicle_capacity_kg: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    driver_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    driver_license_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    stnk_photo: {
        type: DataTypes.STRING, // Path to file
        allowNull: true
    },
    is_cold_storage: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    shipping_cost_per_km: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 10000
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending' // pending, approved, suspended
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
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

Logistik.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export default Logistik;
