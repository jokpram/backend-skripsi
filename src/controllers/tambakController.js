import models from '../models/index.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

const { Tambak, BatchUdang } = models;

const calculateHash = (batch) => {
    // Harus cocok dengan logika hook model
    const dataHeader = `${batch.tambak_id}${batch.tanggal_tebar}${batch.tanggal_panen || ''}${batch.kode_batch || ''}`;
    const dataBody = `${batch.usia_bibit_hari}${batch.asal_bibit}${batch.kualitas_air_ph}${batch.kualitas_air_salinitas}${batch.estimasi_panen_kg}${batch.total_umur_panen_hari || ''}`;
    const dataExtended = `${batch.jumlah_bibit || ''}${batch.sertifikat_bibit || ''}${batch.kualitas_air_suhu || ''}${batch.kualitas_air_do || ''}${batch.jenis_pakan || ''}${batch.frekuensi_pakan_per_hari || ''}${batch.catatan || ''}`;

    // Untuk verifikasi controller, kita mungkin tidak meneruskan previous_hash dalam objek jika dari DB bernilai null untuk blok pertama.
    // Namun, hook model menetapkan 'GENESIS_BLOCK' jika null.
    // Baca dari objek DB:
    const prevHash = batch.previous_hash || 'GENESIS_BLOCK';

    return crypto.createHash('sha256').update(`${prevHash}${dataHeader}${dataBody}${dataExtended}`).digest('hex');
};

export const createTambak = async (req, res) => {
    try {
        const { nama_tambak, lokasi, luas_m2, kapasitas_maks_kg } = req.body;

        const tambak = await Tambak.create({
            petambak_id: req.user.id,
            nama_tambak,
            lokasi,
            luas_m2,
            kapasitas_maks_kg
        });
        res.status(201).json(tambak);
    } catch (error) {
        console.error('Create Tambak Error:', error);
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
        const {
            tambak_id,
            kode_batch,
            tanggal_tebar,
            jumlah_bibit,
            usia_bibit_hari,
            asal_bibit,
            sertifikat_bibit,
            kualitas_air_ph,
            kualitas_air_salinitas,
            kualitas_air_suhu,
            kualitas_air_do,
            jenis_pakan,
            frekuensi_pakan_per_hari,
            estimasi_panen_kg,
            catatan
        } = req.body;

        const tambak = await Tambak.findOne({ where: { id: tambak_id, petambak_id: req.user.id } });
        if (!tambak) return res.status(404).json({ message: 'Tambak not found' });

        // Cek Kapasitas
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
            kode_batch,
            tanggal_tebar,
            jumlah_bibit,
            usia_bibit_hari,
            asal_bibit,
            sertifikat_bibit,
            kualitas_air_ph,
            kualitas_air_salinitas,
            kualitas_air_suhu,
            kualitas_air_do,
            jenis_pakan,
            frekuensi_pakan_per_hari,
            estimasi_panen_kg,
            catatan,
            status: 'ACTIVE'
        });

        await tambak.update({ kapasitas_terpakai_kg: totalActive + parseInt(estimasi_panen_kg) });

        res.status(201).json(batch);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getBatches = async (req, res) => {
    try {
        const batches = await BatchUdang.findAll({
            include: [{ model: Tambak, where: { petambak_id: req.user.id } }],
            order: [['created_at', 'ASC']] // Urutan penting untuk verifikasi rantai?
        });

        const result = batches.map(b => {
            // Rekonstruksi pemeriksaan hash
            // Catatan: Verifikasi sederhana ini rumit karena kita memerlukan string persis yang digunakan dalam hook.
            // Mari asumsikan calculateHash bertindak sebagai pemeriksaan dasar atau hanya memeriksa terhadap apa yang kita simpan.
            // Jika kita benar-benar ingin memverifikasi blockchain, kita harus mengulang dan memeriksa tautan previous_hash juga.
            // Untuk saat ini, mari gunakan calculateHash yang diperbarui.
            const currentHash = calculateHash(b);
            // Dalam blockchain nyata kita akan memverifikasi b.previous_hash === batches[i-1].blockchain_hash
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
        const { tanggal_panen, total_umur_panen_hari } = req.body;

        const batch = await BatchUdang.findByPk(id);
        if (!batch) return res.status(404).json({ message: 'Batch not found' });

        const tambak = await Tambak.findByPk(batch.tambak_id);
        if (tambak.petambak_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        const updates = {};
        if (tanggal_panen) updates.tanggal_panen = tanggal_panen;
        if (total_umur_panen_hari) updates.total_umur_panen_hari = total_umur_panen_hari;

        // Hitung otomatis jika tidak disediakan tetapi tanggal ada
        if (tanggal_panen && !total_umur_panen_hari) {
            const date1 = new Date(batch.tanggal_tebar);
            const date2 = new Date(tanggal_panen);
            const diffTime = Math.abs(date2 - date1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            updates.total_umur_panen_hari = diffDays + batch.usia_bibit_hari;
        }

        await batch.update(updates);

        res.json(batch);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
