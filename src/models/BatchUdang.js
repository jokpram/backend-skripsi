import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import crypto from 'crypto';

const BatchUdang = sequelize.define('BatchUdang', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tambak_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tanggal_tebar: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    tanggal_panen: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    usia_bibit_hari: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    asal_bibit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    kualitas_air_ph: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    kualitas_air_salinitas: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    estimasi_panen_kg: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    blockchain_hash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    blockchain_tx_hash: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'batch_udang',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeSave: (batch) => {
            // Calculate Hash
            // blockchain_hash = SHA256(tambak_id + tanggal_tebar + tanggal_panen + kualitas_air)
            const dataToHash = `${batch.tambak_id}${batch.tanggal_tebar}${batch.tanggal_panen || ''}${batch.kualitas_air_ph}${batch.kualitas_air_salinitas}`;
            batch.blockchain_hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
        }
    }
});

export default BatchUdang;
