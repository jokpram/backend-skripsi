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

        // Tambahkan identifikasi peran
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

export const getChangeRequests = async (req, res) => {
    try {
        const { ChangeRequest, Petambak, Logistik, UdangProduk } = models;
        const requests = await ChangeRequest.findAll({
            where: { status: 'PENDING' },
            order: [['created_at', 'ASC']]
        });

        const petambakIds = requests.filter(r => r.role === 'petambak').map(r => r.user_id);
        const logistikIds = requests.filter(r => r.role === 'logistik').map(r => r.user_id);
        const productIds = requests.filter(r => r.role === 'petambak' && r.target_model === 'UdangProduk').map(r => r.target_id);

        const [petambaks, logistiks, products] = await Promise.all([
            petambakIds.length ? Petambak.findAll({ where: { id: petambakIds } }) : Promise.resolve([]),
            logistikIds.length ? Logistik.findAll({ where: { id: logistikIds } }) : Promise.resolve([]),
            productIds.length ? UdangProduk.findAll({ where: { id: productIds } }) : Promise.resolve([])
        ]);

        const petambakMap = new Map(petambaks.map(u => [u.id, u]));
        const logistikMap = new Map(logistiks.map(u => [u.id, u]));
        const productMap = new Map(products.map(p => [p.id, p]));

        const enrichedRequests = requests.map((req) => {
            let requesterName = 'Unknown';
            let targetInfo = 'Unknown';

            if (req.role === 'petambak') {
                const user = petambakMap.get(req.user_id);
                requesterName = user ? user.name : 'Unknown Petambak';
                const product = productMap.get(req.target_id);
                targetInfo = product ? `${product.jenis_udang} (ID: ${product.id})` : 'Unknown Product';
            } else if (req.role === 'logistik') {
                const user = logistikMap.get(req.user_id);
                requesterName = user ? user.name : 'Unknown Logistik';
                targetInfo = 'Shipping Cost Update';
            }

            return {
                ...req.dataValues,
                requesterName,
                targetInfo
            };
        });

        res.json(enrichedRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const approveChangeRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { ChangeRequest, UdangProduk, Logistik } = models;

        const request = await ChangeRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request already processed' });

        if (request.target_model === 'UdangProduk') {
            const product = await UdangProduk.findByPk(request.target_id);
            if (product) {
                await product.update(request.changes);
            }
        } else if (request.target_model === 'Logistik') {
            const logistik = await Logistik.findByPk(request.target_id);
            if (logistik) {
                await logistik.update(request.changes);
            }
        }

        request.status = 'APPROVED';
        request.reviewed_at = new Date();
        await request.save();

        res.json({ message: 'Request approved and changes applied' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const rejectChangeRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { ChangeRequest } = models;

        const request = await ChangeRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request already processed' });

        request.status = 'REJECTED';
        request.reviewed_at = new Date();
        await request.save();

        res.json({ message: 'Request rejected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
