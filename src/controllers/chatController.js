import { Op } from 'sequelize';
import models from '../models/index.js';
import { getIo } from '../index.js';

const { Message, Admin, Petambak, Logistik, Konsumen } = models;

const getModelForRole = (role) => {
    switch (role) {
        case 'admin': return Admin;
        case 'petambak': return Petambak;
        case 'logistik': return Logistik;
        case 'konsumen': return Konsumen;
        default: return null;
    }
};

export const fetchConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Fetch all unique conversations for this user
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { sender_id: userId, sender_role: userRole },
                    { receiver_id: userId, receiver_role: userRole }
                ]
            },
            order: [['created_at', 'DESC']]
        });

        const conversationsMap = new Map();

        messages.forEach(msg => {
            let otherId, otherRole;
            if (msg.sender_id === userId && msg.sender_role === userRole) {
                otherId = msg.receiver_id;
                otherRole = msg.receiver_role;
            } else {
                otherId = msg.sender_id;
                otherRole = msg.sender_role;
            }

            const key = `${otherRole}_${otherId}`;
            if (!conversationsMap.has(key)) {
                conversationsMap.set(key, {
                    otherId,
                    otherRole,
                    lastMessage: msg.content,
                    time: msg.created_at,
                    unread: (msg.receiver_id === userId && msg.receiver_role === userRole && !msg.is_read) ? 1 : 0
                });
            } else {
                if (msg.receiver_id === userId && msg.receiver_role === userRole && !msg.is_read) {
                    conversationsMap.get(key).unread++;
                }
            }
        });

        // Resolve names for all 'others'
        const result = Array.from(conversationsMap.values());
        for (let conv of result) {
            const Model = getModelForRole(conv.otherRole);
            if (Model) {
                const user = await Model.findByPk(conv.otherId, { attributes: ['id', 'name'] });
                conv.name = user ? user.name : 'Unknown';
            } else {
                conv.name = 'Unknown';
            }
        }

        res.json(result);
    } catch (error) {
        console.error('fetchConversations error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const fetchMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { otherId, otherRole } = req.params;

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { sender_id: userId, sender_role: userRole, receiver_id: otherId, receiver_role: otherRole },
                    { sender_id: otherId, sender_role: otherRole, receiver_id: userId, receiver_role: userRole }
                ]
            },
            order: [['created_at', 'ASC']]
        });

        // Mark as read
        await Message.update(
            { is_read: true },
            {
                where: {
                    receiver_id: userId,
                    receiver_role: userRole,
                    sender_id: otherId,
                    sender_role: otherRole,
                    is_read: false
                }
            }
        );

        res.json(messages);
    } catch (error) {
        console.error('fetchMessages error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { receiverId, receiverRole, content } = req.body;

        const message = await Message.create({
            sender_id: userId,
            sender_role: userRole,
            receiver_id: receiverId,
            receiver_role: receiverRole,
            content
        });

        // Emit via Socket.IO
        const io = getIo();
        if (io) {
            io.to(`${receiverRole}_${receiverId}`).emit('new_message', message);
            // Optionally emit to sender so other devices update
            io.to(`${userRole}_${userId}`).emit('new_message', message);
        }

        res.status(201).json(message);
    } catch (error) {
        console.error('sendMessage error:', error);
        res.status(500).json({ message: error.message });
    }
};
