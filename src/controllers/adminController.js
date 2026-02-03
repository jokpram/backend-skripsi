import models from '../models/index.js';

const { Petambak, Logistik, Konsumen } = models;

export const getPendingUsers = async (req, res) => {
    try {
        const petambakPending = await Petambak.findAll({
            where: { status: 'pending' },
            attributes: { exclude: ['password'] }
        });
        const logistikPending = await Logistik.findAll({
            where: { status: 'pending' },
            attributes: { exclude: ['password'] }
        });
        const konsumenPending = await Konsumen.findAll({
            where: { status: 'pending' },
            attributes: { exclude: ['password'] }
        });

        // Add role identifier
        const formattedPetambak = petambakPending.map(u => ({ ...u.dataValues, role: 'petambak' }));
        const formattedLogistik = logistikPending.map(u => ({ ...u.dataValues, role: 'logistik' }));
        const formattedKonsumen = konsumenPending.map(u => ({ ...u.dataValues, role: 'konsumen' }));

        const allPending = [...formattedPetambak, ...formattedLogistik, ...formattedKonsumen];

        res.json(allPending);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const verifyUser = async (req, res) => {
    const { userId, role, action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action. Use "approve" or "reject".' });
    }

    try {
        let Model;
        if (role === 'petambak') Model = Petambak;
        else if (role === 'logistik') Model = Logistik;
        else if (role === 'konsumen') Model = Konsumen;
        else {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await Model.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = action === 'approve' ? 'approved' : 'rejected';
        await user.save();

        res.json({ message: `User ${action}d successfully`, user });
    } catch (error) {
        console.error('Error verifying user:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
