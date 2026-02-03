import models from '../models/index.js';
import { calculateDistance } from '../utils/distance.js';
import snap from '../utils/midtrans.js';
import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '../models/index.js';
import { generateQRCode } from '../utils/qr.js';

export const createOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { items } = req.body; // [{ produk_id: 1, qty: 10 }]
        const konsumenId = req.user.id;
        const konsumen = await Konsumen.findByPk(konsumenId);

        let totalHargaBarang = 0;
        let totalBerat = 0;
        let totalJarak = 0;

        const productsInfo = [];
        let originTambak = null;

        for (const item of items) {
            const product = await UdangProduk.findByPk(item.produk_id, {
                include: { model: BatchUdang, include: Tambak },
                transaction: t,
                lock: t.LOCK.UPDATE
            });
            if (!product) {
                await t.rollback();
                return res.status(404).json({ message: `Product ${item.produk_id} not found` });
            }
            if (product.stok_kg < item.qty) {
                await t.rollback();
                return res.status(400).json({ message: `Stock insufficient for ${product.jenis_udang} (Grade ${product.grade}). Available: ${product.stok_kg}kg` });
            }

            totalHargaBarang += (parseFloat(product.harga_per_kg) * item.qty);
            totalBerat += item.qty;
            productsInfo.push({ product, qty: item.qty });

            // Deduct Stock immediately to reserve it
            product.stok_kg -= item.qty;
            if (product.stok_kg === 0) product.status = 'SOLD_OUT';
            await product.save({ transaction: t });

            if (!originTambak) originTambak = product.BatchUdang.Tambak;
        }

        if (originTambak && konsumen.latitude && konsumen.longitude) {
            totalJarak = calculateDistance(originTambak.latitude, originTambak.longitude, konsumen.latitude, konsumen.longitude);
        } else {
            totalJarak = 10; // Fallback distance
        }

        const biayaLogistik = Math.ceil(totalJarak / 5) * 10000;
        const subtotal = totalHargaBarang + biayaLogistik;

        const order = await Order.create({
            konsumen_id: konsumenId,
            status: 'PENDING',
            total_harga: subtotal,
            total_jarak_km: totalJarak,
            total_biaya_logistik: biayaLogistik
        }, { transaction: t });

        // Create Items
        for (const info of productsInfo) {
            await OrderItem.create({
                order_id: order.id,
                produk_id: info.product.id,
                qty_kg: info.qty,
                harga_per_kg: info.product.harga_per_kg,
                subtotal: info.product.harga_per_kg * info.qty
            }, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ order, items: productsInfo, logistics: { distance: totalJarak, cost: biayaLogistik } });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

export const getPaymentToken = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findByPk(orderId, { include: Konsumen });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'PENDING') return res.status(400).json({ message: 'Order already processed' });

        const parameter = {
            transaction_details: {
                order_id: `CRONOS-${order.id}-${Date.now()}`,
                gross_amount: Math.round(order.total_harga)
            },
            customer_details: {
                first_name: order.Konsumen.name,
                email: order.Konsumen.email,
                phone: order.Konsumen.phone
            }
        };

        const transaction = await snap.createTransaction(parameter);
        res.json({ token: transaction.token, redirect_url: transaction.redirect_url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const midtransNotification = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const notificationJson = req.body;
        const statusResponse = await snap.transaction.notification(notificationJson);
        const { order_id: midtransOrderId, transaction_status, fraud_status, gross_amount } = statusResponse;

        const internalOrderId = midtransOrderId.split('-')[1];

        const order = await Order.findByPk(internalOrderId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: 'Order not found' });
        }

        if (transaction_status === 'capture' || transaction_status === 'settlement') {
            if (fraud_status === 'challenge') {
                // handle challenge if needed
            } else {
                if (order.status === 'PENDING') {
                    order.status = 'PAID';
                    await order.save({ transaction: t });

                    // Log Payment
                    await PaymentLog.create({
                        order_id: order.id,
                        midtrans_order_id: midtransOrderId,
                        payment_type: statusResponse.payment_type,
                        transaction_status,
                        gross_amount,
                        paid_at: new Date(),
                        raw_callback_json: JSON.stringify(notificationJson)
                    }, { transaction: t });

                    // Admin Escrow Logic
                    const adminWallet = await Wallet.findOne({ where: { owner_type: 'ADMIN' }, transaction: t, lock: t.LOCK.UPDATE });
                    if (adminWallet) {
                        adminWallet.balance = parseFloat(adminWallet.balance) + parseFloat(gross_amount);
                        await adminWallet.save({ transaction: t });

                        await WalletTransaction.create({
                            wallet_id: adminWallet.id,
                            type: 'CREDIT',
                            amount: gross_amount,
                            source: 'ORDER',
                            reference_id: `ORDER-${order.id}`
                        }, { transaction: t });
                    }

                    // Create Delivery record
                    await Delivery.create({
                        order_id: order.id,
                        status: 'PENDING',
                        jarak_km: order.total_jarak_km,
                        biaya_logistik: order.total_biaya_logistik,
                        pickup_qr_token: uuidv4(),
                        receive_qr_token: uuidv4()
                    }, { transaction: t });
                }
            }
        } else if (transaction_status === 'cancel' || transaction_status === 'expire' || transaction_status === 'deny') {
            if (order.status === 'PENDING') {
                order.status = 'CANCELLED';
                await order.save({ transaction: t });

                // Return Stock
                const items = await OrderItem.findAll({ where: { order_id: order.id }, transaction: t });
                for (const item of items) {
                    const product = await UdangProduk.findByPk(item.produk_id, { transaction: t, lock: t.LOCK.UPDATE });
                    if (product) {
                        product.stok_kg += item.qty_kg;
                        if (product.status === 'SOLD_OUT') product.status = 'AVAILABLE';
                        await product.save({ transaction: t });
                    }
                }
            }
        }

        await t.commit();
        res.status(200).send('OK');
    } catch (error) {
        await t.rollback();
        console.error('Midtrans Webhook Error:', error);
        res.status(500).send('Error');
    }
};

export const scanPickup = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { qr_token } = req.body;
        const delivery = await Delivery.findOne({ where: { pickup_qr_token: qr_token }, transaction: t, lock: t.LOCK.UPDATE });
        if (!delivery) {
            await t.rollback();
            return res.status(404).json({ message: 'Invalid Token' });
        }
        if (delivery.status !== 'PENDING' && delivery.status !== 'ASSIGNED') {
            await t.rollback();
            return res.status(400).json({ message: 'Delivery already in progress or completed' });
        }

        await delivery.update({
            status: 'PICKED_UP',
            logistik_id: req.user.id
        }, { transaction: t });

        await Order.update({ status: 'SHIPPED' }, { where: { id: delivery.order_id }, transaction: t });

        await t.commit();
        res.json({ message: 'Pickup Successful', delivery });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

export const scanReceive = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { qr_token } = req.body;
        const delivery = await Delivery.findOne({ where: { receive_qr_token: qr_token }, transaction: t, lock: t.LOCK.UPDATE });
        if (!delivery) {
            await t.rollback();
            return res.status(404).json({ message: 'Invalid Token' });
        }

        const order = await Order.findByPk(delivery.order_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: 'Order not found' });
        }

        if (req.user.role === 'konsumen' && order.konsumen_id !== req.user.id) {
            await t.rollback();
            return res.status(403).json({ message: 'Not your order' });
        }

        if (delivery.status !== 'PICKED_UP') {
            await t.rollback();
            return res.status(400).json({ message: 'Order not picked up yet' });
        }

        // 1. Update Statuses
        delivery.status = 'DELIVERED';
        await delivery.save({ transaction: t });

        order.status = 'COMPLETED';
        await order.save({ transaction: t });

        // 2. Distribute Funds
        const adminFeePerOrder = 2500;
        const logisticFee = parseFloat(delivery.biaya_logistik);
        const totalAmount = parseFloat(order.total_harga); // product_subtotal + logistic_fee

        // Credit Logistik
        const logistikWallet = await Wallet.findOne({ 
            where: { owner_type: 'LOGISTIK', owner_id: delivery.logistik_id }, 
            transaction: t, 
            lock: t.LOCK.UPDATE 
        });
        if (logistikWallet) {
            logistikWallet.balance = parseFloat(logistikWallet.balance) + logisticFee;
            await logistikWallet.save({ transaction: t });
            await WalletTransaction.create({ 
                wallet_id: logistikWallet.id, 
                type: 'CREDIT', 
                amount: logisticFee, 
                source: 'LOGISTIC_FEE', 
                reference_id: `ORDER-${order.id}` 
            }, { transaction: t });
        }

        // Credit Petambak(s)
        const items = await OrderItem.findAll({ 
            where: { order_id: order.id }, 
            include: { model: UdangProduk, include: { model: BatchUdang, include: Tambak } },
            transaction: t
        });

        // Calculate total product revenue (excluding logistics)
        const totalProductRevenue = totalAmount - logisticFee;
        
        // Fairly distribute admin fee across items proportionally? 
        // Or just take it from the total surplus. 
        // Sisa untuk petambak = totalProductRevenue - adminFeePerOrder.
        
        const netProductRevenue = totalProductRevenue - adminFeePerOrder;

        for (const item of items) {
            const petambakId = item.UdangProduk.BatchUdang.Tambak.petambak_id;
            // Proportional payout based on item subtotal relative to totalProductRevenue
            const itemShare = parseFloat(item.subtotal) / totalProductRevenue;
            const payout = netProductRevenue * itemShare;

            const petambakWallet = await Wallet.findOne({ 
                where: { owner_type: 'PETAMBAK', owner_id: petambakId }, 
                transaction: t, 
                lock: t.LOCK.UPDATE 
            });
            if (petambakWallet) {
                petambakWallet.balance = parseFloat(petambakWallet.balance) + payout;
                await petambakWallet.save({ transaction: t });
                await WalletTransaction.create({ 
                    wallet_id: petambakWallet.id, 
                    type: 'CREDIT', 
                    amount: payout, 
                    source: 'ORDER', 
                    reference_id: `ORDER-${order.id}-ITEM-${item.id}` 
                }, { transaction: t });
            }
        }

        // Debit Admin (Escrow Release)
        // Admin keeps the adminFeePerOrder. Admin released (logisticFee + netProductRevenue)
        const totalReleased = logisticFee + netProductRevenue;
        const adminWallet = await Wallet.findOne({ where: { owner_type: 'ADMIN' }, transaction: t, lock: t.LOCK.UPDATE });
        if (adminWallet) {
            adminWallet.balance = parseFloat(adminWallet.balance) - totalReleased;
            await adminWallet.save({ transaction: t });
            await WalletTransaction.create({ 
                wallet_id: adminWallet.id, 
                type: 'DEBIT', 
                amount: totalReleased, 
                source: 'ORDER_RELEASE', 
                reference_id: `RELEASE-${order.id}` 
            }, { transaction: t });
        }

        await t.commit();
        res.json({ message: 'Order Completed & Funds Released', netProductRevenue });
    } catch (error) {
        await t.rollback();
        console.error('Completion Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getOrderQR = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const delivery = await Delivery.findOne({ where: { order_id: orderId } });
        if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

        let qrData = null;
        let type = '';

        if (userRole === 'petambak' || userRole === 'admin') {
            qrData = delivery.pickup_qr_token;
            type = 'PICKUP';
        } else if (userRole === 'logistik') {
            if (delivery.logistik_id && delivery.logistik_id !== userId) {
                return res.status(403).json({ message: 'Not your delivery' });
            }
            qrData = delivery.receive_qr_token;
            type = 'RECEIVE';
        } else {
            return res.status(403).json({ message: 'Role not authorized to view QR' });
        }

        if (qrData) {
            const qrImage = await generateQRCode(qrData);
            res.json({ type, token: qrData, image: qrImage });
        } else {
            res.status(404).json({ message: 'QR Not available' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
