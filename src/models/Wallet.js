import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Wallet = sequelize.define('Wallet', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    owner_type: {
        type: DataTypes.ENUM('ADMIN', 'PETAMBAK', 'LOGISTIK'),
        allowNull: false
    },
    owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    balance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    }
}, {
    tableName: 'wallets',
    timestamps: false
});

export default Wallet;
