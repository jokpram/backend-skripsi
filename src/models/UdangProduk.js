import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UdangProduk = sequelize.define('UdangProduk', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    jenis_udang: {
        type: DataTypes.STRING,
        allowNull: false
    },
    grade: {
        type: DataTypes.STRING, // A, B, C, etc.
        allowNull: false
    },
    harga_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    stok_kg: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('AVAILABLE', 'SOLD_OUT', 'ARCHIVED'),
        defaultValue: 'AVAILABLE'
    }
}, {
    tableName: 'udang_produk',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default UdangProduk;
