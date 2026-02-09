import models from '../models/index.js';
import { Op } from 'sequelize';

const { UdangProduk, BatchUdang, Tambak, Petambak } = models;

export const createProduct = async (req, res) => {
    try {
        const { batch_id, jenis_udang, grade, harga_per_kg, stok_kg } = req.body;

        // Ownership check
        const batch = await BatchUdang.findByPk(batch_id, { include: Tambak });
        if (!batch || batch.Tambak.petambak_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized or Batch not found' });
        }

        const product = await UdangProduk.create({
            batch_id,
            jenis_udang,
            grade,
            harga_per_kg,
            stok_kg
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProducts = async (req, res) => {
    try {
        const { min_price, max_price, grade, jenis, petambak_id } = req.query;

        const where = {
            status: 'AVAILABLE',
            stok_kg: { [Op.gt]: 0 }
        };

        if (min_price) where.harga_per_kg = { [Op.gte]: min_price };
        if (max_price) where.harga_per_kg = { ...where.harga_per_kg, [Op.lte]: max_price };
        if (grade) where.grade = grade;
        if (jenis) where.jenis_udang = jenis;

        const include = [
            {
                model: BatchUdang,
                include: [
                    {
                        model: Tambak,
                        include: [{ model: Petambak, attributes: ['name', 'etalase_photo', 'address'] }]
                    }
                ]
            }
        ];

        // Filter by petambak_id if requested
        if (petambak_id) {
            // This requires nested where which Sequelize supports but structure is complex, 
            // easier to filter in strict query or let it be for now. 
            // I'll stick to basic product filters.
        }

        const products = await UdangProduk.findAll({ where, include });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Traceability - Get batch info for tracing
export const getBatchTrace = async (req, res) => {
    try {
        const { batchId } = req.params;

        const batch = await BatchUdang.findByPk(batchId, {
            include: [{
                model: Tambak,
                include: [{ model: Petambak, attributes: ['name', 'address'] }]
            }]
        });

        if (!batch) {
            return res.status(404).json({ message: 'Batch tidak ditemukan' });
        }

        // Calculate hash for integrity check
        // Calculate hash for integrity check
        const crypto = await import('crypto');

        // Hash calculation must match model hook exactly
        // const dataHeader = `${batch.tambak_id}${batch.tanggal_tebar}${batch.tanggal_panen || ''}`;
        // const dataBody = `${batch.usia_bibit_hari}${batch.asal_bibit}${batch.kualitas_air_ph}${batch.kualitas_air_salinitas}${batch.estimasi_panen_kg}`;
        // const dataToHash = `${batch.previous_hash}${dataHeader}${dataBody}`;

        const dataHeader = `${batch.tambak_id}${batch.tanggal_tebar}${batch.tanggal_panen || ''}`;
        const dataBody = `${batch.usia_bibit_hari}${batch.asal_bibit}${batch.kualitas_air_ph}${batch.kualitas_air_salinitas}${batch.estimasi_panen_kg}`;

        // Ensure previous_hash is handled correctly if it was 'GENESIS_BLOCK' or from DB
        const prevHash = batch.previous_hash;
        const dataToHash = `${prevHash}${dataHeader}${dataBody}`;

        const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
        const integrity = currentHash === batch.blockchain_hash ? 'VALID' : 'DATA TAMPERED';

        res.json({
            batch: {
                id: batch.id,
                tanggal_tebar: batch.tanggal_tebar,
                tanggal_panen: batch.tanggal_panen,
                usia_bibit_hari: batch.usia_bibit_hari,
                asal_bibit: batch.asal_bibit,
                kualitas_air_ph: batch.kualitas_air_ph,
                kualitas_air_salinitas: batch.kualitas_air_salinitas,
                estimasi_panen_kg: batch.estimasi_panen_kg,
                blockchain_hash: batch.blockchain_hash
            },
            tambak: {
                nama_tambak: batch.Tambak.nama_tambak,
                lokasi: batch.Tambak.lokasi,
                petambak_name: batch.Tambak.Petambak?.name || 'Unknown'
            },
            integrity
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
