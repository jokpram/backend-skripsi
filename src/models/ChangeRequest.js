import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ChangeRequest = sequelize.define('ChangeRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: { // Who requested
        type: DataTypes.INTEGER,
        allowNull: false
    },
    role: { // 'petambak' or 'logistik'
        type: DataTypes.STRING,
        allowNull: false
    },
    target_model: { // 'UdangProduk' or 'Logistik'
        type: DataTypes.STRING,
        allowNull: false
    },
    target_id: { // ID of the product or logistik user
        type: DataTypes.INTEGER,
        allowNull: false
    },
    changes: { // JSON of new values
        type: DataTypes.JSON,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING'
    },
    admin_note: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'change_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default ChangeRequest;
