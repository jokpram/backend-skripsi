import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WithdrawRequest = sequelize.define('WithdrawRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    wallet_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING'
    },
    bank_account: {
        type: DataTypes.STRING,
        allowNull: false
    },
    requested_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    processed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'withdraw_requests',
    timestamps: false
});

export default WithdrawRequest;
