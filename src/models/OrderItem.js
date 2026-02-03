import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    produk_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    qty_kg: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    harga_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    }
}, {
    tableName: 'order_items',
    timestamps: false
});

export default OrderItem;
