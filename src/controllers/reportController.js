import models from '../models/index.js';
import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';

const {
    Order,
    Petambak,
    Logistik,
    Konsumen,
    Tambak,
    BatchUdang,
    UdangProduk,
    WithdrawRequest,
    WalletTransaction
} = models;

export const generateAdminReport = async (req, res) => {
    try {
        // Collect Data
        const totalPetambak = await Petambak.count();
        const totalLogistik = await Logistik.count();
        const totalKonsumen = await Konsumen.count();
        const totalTambak = await Tambak.count();

        const totalOrders = await Order.count();
        const completedOrders = await Order.count({ where: { status: 'COMPLETED' } });

        const products = await UdangProduk.sum('stok_kg') || 0;

        // Calculate Revenue (Assuming total_amount in Order is revenue)
        const revenueData = await Order.sum('total_amount', { where: { status: 'COMPLETED' } }) || 0;

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        // Set Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Admin_CRONOS.pdf');

        doc.pipe(res);

        // Header
        doc.fontSize(25).text('Laporan Sistem CRONOS', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Tanggal Laporan: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
        doc.moveDown();
        doc.moveTo(50, 150).lineTo(550, 150).stroke();
        doc.moveDown();

        // 1. User Statistics
        doc.fontSize(16).text('Statistik Pengguna', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`- Petambak Terdaftar: ${totalPetambak}`);
        doc.text(`- Mitra Logistik: ${totalLogistik}`);
        doc.text(`- Konsumen Aktif: ${totalKonsumen}`);
        doc.moveDown();

        // 2. Production Statistics
        doc.fontSize(16).text('Statistik Produksi', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`- Total Tambak: ${totalTambak}`);
        doc.text(`- Stok Udang Tersedia: ${products} Kg`);
        doc.moveDown();

        // 3. Transaction Summary
        doc.fontSize(16).text('Ringkasan Transaksi', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`- Total Order Masuk: ${totalOrders}`);
        doc.text(`- Order Selesai: ${completedOrders}`);
        doc.text(`- Pendapatan (Gross Transaksi): Rp ${revenueData.toLocaleString('id-ID')}`);
        doc.moveDown();

        // Footer
        doc.fontSize(10).text('Dokumen ini digenerate otomatis oleh sistem CRONOS.', 50, 700, { align: 'center', width: 500 });

        doc.end();

    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Gagal membuat laporan PDF' });
        }
    }
};
