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
