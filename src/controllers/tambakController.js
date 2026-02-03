import models from '../models/index.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

const { Tambak, BatchUdang } = models;

const calculateHash = (batch) => {
    const dataToHash = `${batch.tambak_id}${batch.tanggal_tebar}${batch.tanggal_panen || ''}${batch.kualitas_air_ph}${batch.kualitas_air_salinitas}`;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
};

export const createTambak = async (req, res) => {
    try {
        const { nama_tambak, lokasi, luas_m2, kapasitas_maks_kg, latitude, longitude } = req.body;
        // Assume req.user.id is Petambak ID
        const tambak = await Tambak.create({
            petambak_id: req.user.id,
            nama_tambak,
            lokasi,
            luas_m2,
            kapasitas_maks_kg,
            latitude,
            longitude
        });
        res.status(201).json(tambak);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTambaks = async (req, res) => {
    try {
        const where = {};
        if (req.user.role === 'petambak') {
            where.petambak_id = req.user.id;
        }
        const tambaks = await Tambak.findAll({ where });
        res.json(tambaks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createBatch = async (req, res) => {
    try {
        const { tambak_id, tanggal_tebar, usia_bibit_hari, asal_bibit, kualitas_air_ph, kualitas_air_salinitas, estimasi_panen_kg } = req.body;

        const tambak = await Tambak.findOne({ where: { id: tambak_id, petambak_id: req.user.id } });
        if (!tambak) return res.status(404).json({ message: 'Tambak not found' });

        // Check Capacity
        // Sum estimasi_panen_kg of all active batches (where tanggal_panen is null or future?) 
        // Logic: active means currently in pond. So tanggal_panen IS NULL.
        const activeBatches = await BatchUdang.findAll({
            where: {
                tambak_id,
                tanggal_panen: { [Op.eq]: null }
            }
        });

        const totalActive = activeBatches.reduce((sum, b) => sum + b.estimasi_panen_kg, 0);
        if (totalActive + parseInt(estimasi_panen_kg) > tambak.kapasitas_maks_kg) {
            return res.status(400).json({ message: 'Over capacity' });
        }

        const batch = await BatchUdang.create({
            tambak_id,
            tanggal_tebar,
            usia_bibit_hari,
            asal_bibit,
            kualitas_air_ph,
            kualitas_air_salinitas,
            estimasi_panen_kg
        });

        // Update usage
        await tambak.update({ kapasitas_terpakai_kg: totalActive + parseInt(estimasi_panen_kg) });

        res.status(201).json(batch);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getBatches = async (req, res) => {
    try {
        const batches = await BatchUdang.findAll({
            include: [{ model: Tambak, where: { petambak_id: req.user.id } }]
        });

        // Check integrity for each
        const result = batches.map(b => {
            const currentHash = calculateHash(b);
            const isTampered = currentHash !== b.blockchain_hash;
            return {
                ...b.toJSON(),
                integrity: isTampered ? 'DATA TAMPERED' : 'VALID'
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateHarvest = async (req, res) => { // Panen
    try {
        const { id } = req.params;
        const { tanggal_panen } = req.body;

        const batch = await BatchUdang.findByPk(id);
        if (!batch) return res.status(404).json({ message: 'Batch not found' });

        // Verify ownership via Tambak...
        const tambak = await Tambak.findByPk(batch.tambak_id);
        if (tambak.petambak_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        await batch.update({ tanggal_panen });

        // Recalculate hash because data changed? Or keep original hash of creation? 
        // Prompt says "blockchain_hash = SHA256(..., tanggal_panen, ...)" so yes, update hash.
        // Hook `beforeSave` will handle it.

        res.json(batch);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
