import jwt from 'jsonwebtoken';
import models from '../models/index.js';

const { Admin, Petambak, Logistik, Konsumen } = models;

export const verifyToken = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = decoded; // { id: 1, role: 'admin' }

            // Opsional: Verifikasi keberadaan di DB jika diperlukan secara ketat
            let userExists = null;
            if (decoded.role === 'admin') userExists = await Admin.findByPk(decoded.id);
            else if (decoded.role === 'petambak') userExists = await Petambak.findByPk(decoded.id);
            else if (decoded.role === 'logistik') userExists = await Logistik.findByPk(decoded.id);
            else if (decoded.role === 'konsumen') userExists = await Konsumen.findByPk(decoded.id);

            if (!userExists) {
                return res.status(401).json({ message: 'User not found or deactivated' });
            }

            // Cek status akun untuk pengguna non-admin
            if (req.user.role !== 'admin' && userExists.status !== 'approved') {
                return res.status(403).json({
                    message: 'Account not active. Please wait for admin verification.',
                    status: userExists.status
                });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role (${req.user ? req.user.role : 'none'}) is not allowed to access this resource`
            });
        }
        next();
    };
};

export const isAdmin = authorizeRoles('admin');
