import models from '../models/index.js';
import { Op } from 'sequelize';

const { UdangProduk, BatchUdang, Tambak, Petambak } = models;

export const createProduct = async (req, res) => {
    try {
        const {
            batch_id,
            kode_produk,
            jenis_udang,
            grade,
            size_per_kg,
            metode_panen,
            metode_pendinginan,
            sertifikat_halal,
            sertifikat_uji_lab,
            harga_per_kg,
            minimum_order_kg,
            stok_kg,
            expired_date,
            kategori
        } = req.body;

        // Pemeriksaan Kepemilikan
        const batch = await BatchUdang.findByPk(batch_id, { include: Tambak });
        if (!batch || batch.Tambak.petambak_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized or Batch not found' });
        }

        const product = await UdangProduk.create({
            batch_id,
            kode_produk,
            jenis_udang,
            grade,
            size_per_kg,
            metode_panen,
            metode_pendinginan,
            sertifikat_halal,
            sertifikat_uji_lab,
            harga_per_kg,
            minimum_order_kg,
            stok_kg,
            expired_date,
            kategori: kategori || 'UTAMA',
            status: 'AVAILABLE'
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProducts = async (req, res) => {
    try {
        const { min_price, max_price, grade, jenis, petambak_id, kategori } = req.query;

        const where = {
            status: 'AVAILABLE',
            stok_kg: { [Op.gt]: 0 }
        };

        if (min_price) where.harga_per_kg = { [Op.gte]: min_price };
        if (max_price) where.harga_per_kg = { ...where.harga_per_kg, [Op.lte]: max_price };
        if (grade) where.grade = grade;
        if (jenis) where.jenis_udang = jenis;
        if (kategori) where.kategori = kategori;

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

        // Filter berdasarkan petambak_id jika diminta
        if (petambak_id) {
            // Ini memerlukan where bersarang yang didukung Sequelize tetapi strukturnya kompleks, 
            // lebih mudah untuk memfilter dalam kueri ketat atau biarkan saja untuk saat ini. 
            // Saya akan tetap menggunakan filter produk dasar.
        }

        const products = await UdangProduk.findAll({ where, include });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Ambil produk milik petambak yang sedang login
export const getMyProducts = async (req, res) => {
    try {
        const products = await UdangProduk.findAll({
            include: [{
                model: BatchUdang,
                required: true,
                include: [{
                    model: Tambak,
                    required: true,
                    where: { petambak_id: req.user.id }
                }]
            }],
            order: [['created_at', 'DESC']]
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Ketertelusuran - Ambil info batch untuk pelacakan
export const getBatchTrace = async (req, res) => {
    try {
        const { batchId } = req.params;

        const where = {
            [Op.or]: [
                { kode_batch: batchId },
                // Hanya cari berdasarkan ID jika batchId berupa angka untuk menghindari kesalahan tipe
                ...(item_id_is_numeric(batchId) ? [{ id: batchId }] : [])
            ]
        };

        function item_id_is_numeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        const batch = await BatchUdang.findOne({
            where,
            include: [{
                model: Tambak,
                include: [{ model: Petambak, attributes: ['name', 'address'] }]
            }]
        });

        if (!batch) {
            return res.status(404).json({ message: 'Batch tidak ditemukan' });
        }

        // Hitung hash untuk pemeriksaan integritas
        // Logika HARUS cocok dengan tambakController.js calculateHash
        const crypto = await import('crypto');

        const dataHeader = `${batch.tambak_id}${batch.tanggal_tebar}${batch.tanggal_panen || ''}${batch.kode_batch || ''}`;
        const dataBody = `${batch.usia_bibit_hari}${batch.asal_bibit}${batch.kualitas_air_ph}${batch.kualitas_air_salinitas}${batch.estimasi_panen_kg}${batch.total_umur_panen_hari || ''}`;
        const dataExtended = `${batch.jumlah_bibit || ''}${batch.sertifikat_bibit || ''}${batch.kualitas_air_suhu || ''}${batch.kualitas_air_do || ''}${batch.jenis_pakan || ''}${batch.frekuensi_pakan_per_hari || ''}${batch.catatan || ''}`;

        const prevHash = batch.previous_hash || 'GENESIS_BLOCK';
        const dataToHash = `${prevHash}${dataHeader}${dataBody}${dataExtended}`;

        const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
        const integrity = currentHash === batch.blockchain_hash ? 'VALID' : 'DATA TAMPERED';

        res.json({
            batch: {
                id: batch.id,
                kode_batch: batch.kode_batch,
                tanggal_tebar: batch.tanggal_tebar,
                tanggal_panen: batch.tanggal_panen,
                usia_bibit_hari: batch.usia_bibit_hari,
                total_umur_panen_hari: batch.total_umur_panen_hari,
                asal_bibit: batch.asal_bibit,
                jumlah_bibit: batch.jumlah_bibit,
                sertifikat_bibit: batch.sertifikat_bibit,

                // Kualitas Air
                kualitas_air_ph: batch.kualitas_air_ph,
                kualitas_air_salinitas: batch.kualitas_air_salinitas,
                kualitas_air_suhu: batch.kualitas_air_suhu,
                kualitas_air_do: batch.kualitas_air_do,

                // Pakan
                jenis_pakan: batch.jenis_pakan,
                frekuensi_pakan_per_hari: batch.frekuensi_pakan_per_hari,

                // Lainnya
                estimasi_panen_kg: batch.estimasi_panen_kg,
                catatan: batch.catatan,
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

export const requestProductUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { jenis_udang, grade, harga_per_kg } = req.body;
        const { ChangeRequest } = models;

        const product = await UdangProduk.findByPk(id, {
            include: [{
                model: BatchUdang,
                include: [{ model: Tambak }]
            }]
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Verify ownership
        if (product.BatchUdang.Tambak.petambak_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const changes = {};
        if (jenis_udang) changes.jenis_udang = jenis_udang;
        if (grade) changes.grade = grade;
        if (harga_per_kg) changes.harga_per_kg = harga_per_kg;

        if (Object.keys(changes).length === 0) {
            return res.status(400).json({ message: 'No changes provided' });
        }

        await ChangeRequest.create({
            user_id: req.user.id,
            role: 'petambak',
            target_model: 'UdangProduk',
            target_id: product.id,
            changes,
            status: 'PENDING'
        });

        res.status(201).json({ message: 'Update request submitted for approval' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
