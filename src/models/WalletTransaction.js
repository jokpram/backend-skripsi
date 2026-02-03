import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WalletTransaction = sequelize.define('WalletTransaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    wallet_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('CREDIT', 'DEBIT'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    source: {
        type: DataTypes.ENUM('ORDER', 'LOGISTIC_FEE', 'ADMIN_FEE', 'WITHDRAWAL'),
        allowNull: false
    },
    reference_id: {
        type: DataTypes.STRING, // Could be Order ID or others
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'wallet_transactions',
    timestamps: false
});

export default WalletTransaction;
