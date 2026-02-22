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
    // Enhanced Fields
    kode_batch: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    jumlah_bibit: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sertifikat_bibit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    kualitas_air_suhu: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    kualitas_air_do: {
        type: DataTypes.FLOAT, // Dissolved Oxygen
        allowNull: true
    },
    jenis_pakan: {
        type: DataTypes.STRING,
        allowNull: true
    },
    frekuensi_pakan_per_hari: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    catatan: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'ACTIVE' // ACTIVE, HARVESTED, CANCELLED
    },
    // Blockchain & System
    blockchain_hash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    blockchain_tx_hash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    previous_hash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    total_umur_panen_hari: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'batch_udang',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeSave: async (batch) => {
            // Find previous batch for the same tambak to chain hashes
            if (!batch.previous_hash) {
                const previousBatch = await BatchUdang.findOne({
                    where: { tambak_id: batch.tambak_id },
                    order: [['created_at', 'DESC']],
                    attributes: ['blockchain_hash']
                });
                batch.previous_hash = previousBatch && previousBatch.blockchain_hash ? previousBatch.blockchain_hash : 'GENESIS_BLOCK';
            }

            // Calculate Hash
            // blockchain_hash = SHA256(index + previous_hash + timestamp + data + extended_data)
            const dataHeader = `${batch.tambak_id}${batch.tanggal_tebar}${batch.tanggal_panen || ''}${batch.kode_batch || ''}`;
            const dataBody = `${batch.usia_bibit_hari}${batch.asal_bibit}${batch.kualitas_air_ph}${batch.kualitas_air_salinitas}${batch.estimasi_panen_kg}${batch.total_umur_panen_hari || ''}`;
            const dataExtended = `${batch.jumlah_bibit || ''}${batch.sertifikat_bibit || ''}${batch.kualitas_air_suhu || ''}${batch.kualitas_air_do || ''}${batch.jenis_pakan || ''}${batch.frekuensi_pakan_per_hari || ''}${batch.catatan || ''}`;
            const dataToHash = `${batch.previous_hash}${dataHeader}${dataBody}${dataExtended}`;

            batch.blockchain_hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
        }
    }
});

export default BatchUdang;
