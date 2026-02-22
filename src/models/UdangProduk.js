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
    // Enhanced Fields
    kode_produk: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    size_per_kg: {
        type: DataTypes.STRING, // "40-50"
        allowNull: true
    },
    metode_panen: {
        type: DataTypes.STRING,
        allowNull: true
    },
    metode_pendinginan: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sertifikat_halal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    sertifikat_uji_lab: {
        type: DataTypes.STRING,
        allowNull: true
    },
    minimum_order_kg: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    expired_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    },
    kategori: {
        type: DataTypes.ENUM('UTAMA', 'ECO'),
        defaultValue: 'UTAMA' // UTAMA = Produk Utama, ECO = Produk Ekonomi Sirkular (Limbah, dll)
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
