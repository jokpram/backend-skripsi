import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PaymentLog = sequelize.define('PaymentLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    midtrans_order_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payment_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transaction_status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gross_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
    },
    paid_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    raw_callback_json: {
        type: DataTypes.TEXT, // Store JSON string
        allowNull: true
    }
}, {
    tableName: 'payment_logs',
    timestamps: false
});

export default PaymentLog;
