import models from '../models/index.js';
import { sequelize } from '../models/index.js';

const { Wallet, WalletTransaction, WithdrawRequest } = models;

export const getMyWallet = async (req, res) => {
    try {
        const { id, role } = req.user;
        const ownerType = role.toUpperCase();

        const wallet = await Wallet.findOne({
            where: { owner_id: id, owner_type: ownerType },
            include: [{
                model: WalletTransaction,
                as: 'transactions',
                limit: 10,
                order: [['created_at', 'DESC']]
            }]
        });

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const requestWithdraw = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { amount, bank_account } = req.body;
        const { id, role } = req.user;
        const ownerType = role.toUpperCase();

        if (amount <= 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const wallet = await Wallet.findOne({
            where: { owner_id: id, owner_type: ownerType },
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!wallet) {
            await t.rollback();
            return res.status(404).json({ message: 'Wallet not found' });
        }

        if (parseFloat(wallet.balance) < parseFloat(amount)) {
            await t.rollback();
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Deduct balance immediately (move to locked/pending?) 
        // For simplicity: Deduct now, if rejected, refund.
        wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
        await wallet.save({ transaction: t });

        await WalletTransaction.create({
            wallet_id: wallet.id,
            type: 'DEBIT',
            amount: amount,
            source: 'WITHDRAWAL',
            reference_id: 'PENDING'
        }, { transaction: t });

        const withdraw = await WithdrawRequest.create({
            wallet_id: wallet.id,
            amount,
            bank_account,
            status: 'PENDING'
        }, { transaction: t });

        await t.commit();
        res.status(201).json(withdraw);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

export const getWithdrawRequests = async (req, res) => {
    try {
        const { role, id } = req.user;
        let where = {};

        if (role !== 'admin') {
            const wallet = await Wallet.findOne({ where: { owner_id: id, owner_type: role.toUpperCase() } });
            if (!wallet) return res.json([]);
            where.wallet_id = wallet.id;
        }

        const requests = await WithdrawRequest.findAll({
            where,
            order: [['requested_at', 'DESC']]
        });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const processWithdraw = async (req, res) => {
    // Admin only
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { action } = req.body; // 'APPROVE' or 'REJECT'

        const withdraw = await WithdrawRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!withdraw) {
            await t.rollback();
            return res.status(404).json({ message: 'Request not found' });
        }

        if (withdraw.status !== 'PENDING') {
            await t.rollback();
            return res.status(400).json({ message: 'Request already processed' });
        }

        if (action === 'APPROVE') {
            withdraw.status = 'APPROVED';
            withdraw.processed_at = new Date();
        } else if (action === 'REJECT') {
            withdraw.status = 'REJECTED';
            withdraw.processed_at = new Date();

            // Refund wallet
            const wallet = await Wallet.findByPk(withdraw.wallet_id, { transaction: t, lock: t.LOCK.UPDATE });
            wallet.balance = parseFloat(wallet.balance) + parseFloat(withdraw.amount);
            await wallet.save({ transaction: t });

            await WalletTransaction.create({
                wallet_id: wallet.id,
                type: 'CREDIT',
                amount: withdraw.amount,
                source: 'WITHDRAW_REFUND',
                reference_id: `REFUND-${withdraw.id}`
            }, { transaction: t });
        } else {
            await t.rollback();
            return res.status(400).json({ message: 'Invalid action' });
        }

        await withdraw.save({ transaction: t });
        await t.commit();
        res.json({ message: `Withdraw ${action}D successfully` });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};
