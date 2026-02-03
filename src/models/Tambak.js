import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Tambak = sequelize.define('Tambak', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    petambak_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nama_tambak: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lokasi: {
        type: DataTypes.STRING,
        allowNull: false
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: true // For distance calculation
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: true // For distance calculation
    },
    luas_m2: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    kapasitas_maks_kg: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    kapasitas_terpakai_kg: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'tambaks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Tambak;
