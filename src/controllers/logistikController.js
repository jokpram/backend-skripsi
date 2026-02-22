import models from '../models/index.js';

const { Logistik, ChangeRequest } = models;

export const requestPriceUpdate = async (req, res) => {
    try {
        const { shipping_cost_per_km } = req.body;

        if (!shipping_cost_per_km) {
            return res.status(400).json({ message: 'Shipping cost is required' });
        }

        await ChangeRequest.create({
            user_id: req.user.id,
            role: 'logistik',
            target_model: 'Logistik',
            target_id: req.user.id,
            changes: { shipping_cost_per_km },
            status: 'PENDING'
        });

        res.status(201).json({ message: 'Price update request submitted for approval' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
