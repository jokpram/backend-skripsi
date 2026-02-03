import models from '../models/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const { Admin, Petambak, Logistik, Konsumen, Wallet } = models;

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// --- Register ---

export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await Admin.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await Admin.create({ name, email, password });

        // Create Wallet for Admin
        await Wallet.create({ owner_type: 'ADMIN', owner_id: user.id });

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'admin',
            token: generateToken(user.id, 'admin')
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const registerPetambak = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        const userExists = await Petambak.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await Petambak.create({ name, email, password, phone, address });

        // Create Wallet for Petambak
        await Wallet.create({ owner_type: 'PETAMBAK', owner_id: user.id });

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'petambak',
            token: generateToken(user.id, 'petambak')
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const registerLogistik = async (req, res) => {
    try {
        const { name, email, password, phone, vehicle_type, license_plate } = req.body;
        const userExists = await Logistik.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await Logistik.create({ name, email, password, phone, vehicle_type, license_plate });

        // Create Wallet for Logistik
        await Wallet.create({ owner_type: 'LOGISTIK', owner_id: user.id });

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'logistik',
            token: generateToken(user.id, 'logistik')
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const registerKonsumen = async (req, res) => {
    try {
        const { name, email, password, phone, address, latitude, longitude } = req.body;
        const userExists = await Konsumen.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await Konsumen.create({ name, email, password, phone, address, latitude, longitude });
        // Konsumen doesn't necessarily need a wallet in this system description ("Petambak & Logistik memiliki wallet internal... Semua pembayaran masuk Escrow Admin"), but maybe needed for refunds? Prompt didn't specify wallet for Konsumen, but "Petambak & Logistik memiliki wallet internal" implies Konsumen might not. I won't create one for Konsumen for now.

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'konsumen',
            token: generateToken(user.id, 'konsumen')
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Login ---

const loginUser = async (req, res, RoleModel, roleName) => {
    try {
        const { email, password } = req.body;
        const user = await RoleModel.findOne({ where: { email } });

        if (user && (await bcrypt.compare(password, user.password))) { // Or user.validatePassword(password)
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: roleName,
                token: generateToken(user.id, roleName)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const loginAdmin = (req, res) => loginUser(req, res, Admin, 'admin');
export const loginPetambak = (req, res) => loginUser(req, res, Petambak, 'petambak');
export const loginLogistik = (req, res) => loginUser(req, res, Logistik, 'logistik');
export const loginKonsumen = (req, res) => loginUser(req, res, Konsumen, 'konsumen');

// --- Profile ---

export const getProfile = async (req, res) => {
    // req.user is set by middleware
    const { id, role } = req.user;
    let user;
    if (role === 'admin') user = await Admin.findByPk(id, { attributes: { exclude: ['password'] } });
    else if (role === 'petambak') user = await Petambak.findByPk(id, { attributes: { exclude: ['password'] } });
    else if (role === 'logistik') user = await Logistik.findByPk(id, { attributes: { exclude: ['password'] } });
    else if (role === 'konsumen') user = await Konsumen.findByPk(id, { attributes: { exclude: ['password'] } });

    if (user) res.json(user);
    else res.status(404).json({ message: 'User not found' });
};

export const updateProfile = async (req, res) => {
    const { id, role } = req.user;
    const updates = req.body;

    // Logic to prevent updating critical fields if necessary
    // Handle photo upload if file present
    if (req.file) {
        if (role === 'petambak' && req.body.type === 'etalase') {
            updates.etalase_photo = req.file.path;
        } else {
            updates.profile_photo = req.file.path;
        }
    }

    let Model;
    if (role === 'admin') Model = Admin;
    else if (role === 'petambak') Model = Petambak;
    else if (role === 'logistik') Model = Logistik;
    else if (role === 'konsumen') Model = Konsumen;

    await Model.update(updates, { where: { id } });
    const updatedUser = await Model.findByPk(id, { attributes: { exclude: ['password'] } });
    res.json(updatedUser);
};
