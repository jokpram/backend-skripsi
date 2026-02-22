import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    konsumen_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'),
        defaultValue: 'PENDING'
    },
    total_harga: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    total_jarak_km: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    total_biaya_logistik: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    // Enhanced Fields
    delivery_method: {
        type: DataTypes.STRING, // DELIVERY, PICKUP
        defaultValue: 'DELIVERY'
    },
    delivery_address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    delivery_latitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    delivery_longitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    delivery_note: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payment_method: {
        type: DataTypes.STRING, // MIDTRANS, TRANSFER, COD
        defaultValue: 'MIDTRANS'
    },
    insurance: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    expected_delivery_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Order;
