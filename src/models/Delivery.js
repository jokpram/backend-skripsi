import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Delivery = sequelize.define('Delivery', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    logistik_id: {
        type: DataTypes.INTEGER,
        allowNull: true // Assigned later
    },
    vehicle_id: {
        type: DataTypes.STRING, // Or FK if we had vehicles table
        allowNull: true
    },
    jarak_km: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    biaya_logistik: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'COMPLETED'),
        defaultValue: 'PENDING'
    },
    pickup_qr_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    receive_qr_token: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'deliveries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Delivery;
