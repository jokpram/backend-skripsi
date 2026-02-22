import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { globalLimiter, authLimiter } from './middleware/rateLimitMiddleware.js';

import sequelize from './config/database.js';
import models from './models/index.js'; // Pemicu pemuatan asosiasi

import authRoutes from './routes/authRoutes.js';
import tambakRoutes from './routes/tambakRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import logistikRoutes from './routes/logistikRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
let io;
if (!io) {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
}
export const getIo = () => io;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pembatasan Kecepatan - 50 permintaan per menit per IP
app.use(globalLimiter);

// Statis
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rute
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tambak', tambakRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/logistik', logistikRoutes);
app.use('/api/chat', chatRoutes);


// API Documentation & Dashboard
// Dokumentasi API & Dasbor
app.all('/', async (req, res) => {
    const password = req.query.password || '';
    const validHash = 'e90f23f80c65360934f0e75685261d7b';

    const crypto = await import('crypto');
    const inputHash = crypto.createHash('md5').update(password).digest('hex');

    // If user provided the correct hash directly, allow access
    if (password === validHash) {
        // Proceed to render docs
    }
    // If user provided plain text password, redirect to hash to hide it
    else if (inputHash === validHash) {
        return res.redirect(`/?password=${validHash}`);
    }
    // Otherwise, deny access
    else {
        return res.status(401).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Access Denied</title>
                <style>
                    body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background-color: #f3f4f6; }
                    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; }
                    input { padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; margin-top: 1rem; width: 100%; box-sizing: border-box; }
                    button { margin-top: 1rem; padding: 0.5rem 1rem; background-color: #10b981; color: white; border: none; border-radius: 0.375rem; cursor: pointer; width: 100%; font-weight: bold; }
                    button:hover { background-color: #059669; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2 style="color: #ef4444;">Access Restricted</h2>
                    <p>Please enter the password to view the API documentation.</p>
                    <form method="GET" action="/">
                        <input type="password" name="password" placeholder="Enter password" required autofocus>
                        <button type="submit">Unlock</button>
                    </form>
                </div>
            </body>
            </html>
        `);
    }

    // const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const fullUrl = `https://cronos.c-greenproject.org${req.originalUrl}`;

    // Data Dokumentasi
    const apiDocs = {
        // ... (previous docs data) ...
        // --- OTENTIKASI ---
        "POST /api/auth/register/admin": {
            access: "Public",
            description: "Register new Admin",
            body: { name: "Super Admin", email: "admin@cronos.com", password: "password123" }
        },
        "POST /api/auth/register/petambak": {
            access: "Public",
            description: "Register new Petambak (Professional)",
            body: {
                name: "Petambak Sejahtera",
                email: "petambak@email.com",
                password: "password123",
                phone: "08123456789",
                address: "Jl. Pesisir No. 1",
                nik: "3201xxxxxxxx",
                npwp: "12.345.678.9-123.000",
                bank_name: "BCA",
                bank_account_number: "1234567890",
                bank_account_name: "Petambak Sejahtera"
            }
        },
        "POST /api/auth/register/logistik": {
            access: "Public",
            description: "Register new Logistik Partner (Professional)",
            body: {
                name: "Cepat Express",
                email: "logistik@email.com",
                password: "password123",
                phone: "08198765432",
                vehicle_type: "Pickup Box",
                vehicle_capacity_kg: 1000,
                license_plate: "B 9999 XX",
                driver_name: "Budi",
                driver_license_number: "SIM123456",
                is_cold_storage: true
            }
        },
        "POST /api/auth/register/konsumen": {
            access: "Public",
            description: "Register new Konsumen",
            body: { name: "John Doe", email: "konsumen@email.com", password: "password123", phone: "08567890123", address: "Jakarta Selatan", latitude: -6.2, longitude: 106.8 }
        },
        "POST /api/auth/login/admin": {
            access: "Public",
            description: "Login as Admin",
            body: { email: "admin@cronos.com", password: "password123" }
        },
        "POST /api/auth/login/petambak": {
            access: "Public",
            description: "Login as Petambak",
            body: { email: "petambak@email.com", password: "password123" }
        },
        "POST /api/auth/login/logistik": {
            access: "Public",
            description: "Login as Logistik",
            body: { email: "logistik@email.com", password: "password123" }
        },
        "POST /api/auth/login/konsumen": {
            access: "Public",
            description: "Login as Konsumen",
            body: { email: "konsumen@email.com", password: "password123" }
        },
        "PUT /api/auth/profile": {
            access: "Authenticated",
            description: "Update Profile",
            body: { name: "New Name", phone: "081...", address: "New Address", profile_photo: "(Multipart File)" }
        },
        "GET /api/auth/profile": {
            access: "Authenticated",
            description: "Get Current User Profile"
        },

        // --- TAMBAK ---
        "POST /api/tambak/": {
            access: "Petambak",
            description: "Create new Tambak",
            body: { nama_tambak: "Tambak Udang Jaya", lokasi: "Lampung", luas_m2: 5000, kapasitas_maks_kg: 2000 }
        },
        "GET /api/tambak/": {
            access: "Petambak/Public",
            description: "Get all tambaks (Petambak sees own, others might see filtered)"
        },
        "POST /api/tambak/batch": {
            access: "Petambak",
            description: "Create new Batch Udang (Bio & IoT Data)",
            body: {
                tambak_id: 1,
                kode_batch: "CRN-BATCH-2024-001",
                tanggal_tebar: "2024-01-01",
                jumlah_bibit: 100000,
                usia_bibit_hari: 10,
                asal_bibit: "Hatchery A",
                sertifikat_bibit: "No-Sertifikat-123",
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 20,
                kualitas_air_suhu: 28,
                kualitas_air_do: 5.5,
                jenis_pakan: "PF800",
                frekuensi_pakan_per_hari: 4,
                estimasi_panen_kg: 1000,
                catatan: "Kondisi stabil minggu pertama"
            }
        },
        "GET /api/tambak/batch": {
            access: "Petambak",
            description: "Get all batches with Blockchain Integrity Check"
        },
        "PUT /api/tambak/batch/:id/harvest": {
            access: "Petambak",
            description: "Record Harvest (Set Harvest Date & Total Age)",
            body: { tanggal_panen: "2024-04-01", total_umur_panen_hari: 100 }
        },

        // --- PRODUK ---
        "POST /api/products/": {
            access: "Petambak",
            description: "Create Product Listing from Batch (Commercial)",
            body: {
                batch_id: 1,
                kode_produk: "CRN-PRD-001",
                jenis_udang: "Vannamei",
                grade: "A",
                size_per_kg: "40-50",
                metode_panen: "Jaring Manual",
                metode_pendinginan: "Ice Slurry",
                sertifikat_halal: true,
                sertifikat_uji_lab: "LAB-2024-001",
                harga_per_kg: 85000,
                minimum_order_kg: 5,
                stok_kg: 500,
                expired_date: "2024-04-10"
            }
        },
        "GET /api/products/": {
            access: "Public",
            description: "List Products. Filter: ?min_price=10000&max_price=90000&grade=A&jenis=Vannamei"
        },
        "GET /api/products/trace/:batchId": {
            access: "Public",
            description: "Traceability & Blockchain Info"
        },

        // --- PESANAN ---
        "POST /api/orders/": {
            access: "Konsumen",
            description: "Create Order (Enterprise Options)",
            body: {
                items: [{ produk_id: 1, qty: 10, catatan: "Size seragam" }],
                delivery_method: "DELIVERY",
                delivery_address: "Jakarta Selatan",
                delivery_latitude: -6.2,
                delivery_longitude: 106.8,
                delivery_note: "Hubungi sebelum sampai",
                payment_method: "MIDTRANS",
                insurance: true,
                expected_delivery_date: "2024-04-05"
            }
        },
        "POST /api/orders/payment-token": {
            access: "Konsumen",
            description: "Get Midtrans Payment Token",
            body: { orderId: 1 }
        },
        "POST /api/orders/midtrans-notification": {
            access: "System (Webhook)",
            description: "Midtrans Webhook Handler",
            body: { order_id: "CRONOS-1-...", transaction_status: "settlement", fraud_status: "accept" }
        },
        "POST /api/orders/scan-pickup": {
            access: "Logistik",
            description: "Driver scans Pickup QR at Tambak",
            body: { qr_token: "UUID-TOKEN-FROM-PETAMBAK" }
        },
        "POST /api/orders/scan-receive": {
            access: "Konsumen/Logistik",
            description: "Confirm Receipt (Scan Receive QR)",
            body: { qr_token: "UUID-TOKEN-FROM-DRIVER" }
        },
        "GET /api/orders/my-orders": {
            access: "Konsumen",
            description: "Get My Order History"
        },
        "GET /api/orders/my-deliveries": {
            access: "Logistik",
            description: "Get My Delivery History"
        },
        "GET /api/orders/available-deliveries": {
            access: "Logistik",
            description: "Get Open Deliveries to Pick Up"
        },
        "GET /api/orders/petambak-orders": {
            access: "Petambak",
            description: "Get Orders containing my products"
        },
        "GET /api/orders/:orderId/qr": {
            access: "Authenticated",
            description: "Get QR Code Image for Order (Pickup/Receive)"
        },

        // --- DOMPET ---
        "GET /api/wallet/my-wallet": {
            access: "Authenticated",
            description: "Get Wallet Balance & Transactions"
        },
        "POST /api/wallet/withdraw": {
            access: "Authenticated",
            description: "Request Withdrawal",
            body: {
                amount: 500000,
                bank_name: "BCA",
                bank_account_number: "1234567890",
                bank_account_name: "Petambak Sejahtera",
                pin_transaction: "123456"
            }
        },
        "GET /api/wallet/withdraw-requests": {
            access: "Authenticated",
            description: "Get My Withdraw Requests (Or All if Admin)"
        },
        "POST /api/wallet/withdraw/:id/process": {
            access: "Admin",
            description: "Approve/Reject Withdraw Request",
            body: { action: "APPROVE" }
        },

        // --- ADMIN ---
        "GET /api/admin/pending-users": {
            access: "Admin",
            description: "Get users waiting for verification"
        },
        "POST /api/admin/verify-user": {
            access: "Admin",
            description: "Verify User Registration",
            body: { userId: 1, role: "petambak", action: "approve" } // or "reject"
        },

        // --- LAPORAN ---
        "GET /api/reports/admin": {
            access: "Admin",
            description: "Get System Reports & Stats"
        }
    };

    // Pembantu untuk mengekstrak rute
    const getRoutes = () => {
        const routeList = [];
        const routerMap = [
            { base: '/api/auth', router: authRoutes, name: 'Auth' },
            { base: '/api/tambak', router: tambakRoutes, name: 'Tambak' },
            { base: '/api/products', router: productRoutes, name: 'Products' },
            { base: '/api/orders', router: orderRoutes, name: 'Orders' },
            { base: '/api/admin', router: adminRoutes, name: 'Admin' },
            { base: '/api/wallet', router: walletRoutes, name: 'Wallet' },
            { base: '/api/reports', router: reportRoutes, name: 'Reports' },
        ];

        routerMap.forEach(({ base, router, name }) => {
            if (router && router.stack) {
                router.stack.forEach((layer) => {
                    if (layer.route) {
                        const path = layer.route.path;
                        const methods = Object.keys(layer.route.methods).filter(m => m !== '_all').join(', ').toUpperCase();
                        const fullPath = `${base}${path}`;

                        // Coba cocokkan jalur persis atau jalur berparameter
                        // Pencarian sederhana untuk saat ini.
                        let key = `${methods} ${fullPath}`;
                        // Pencocokan cadangan untuk menangani :id vs spesifik
                        if (!apiDocs[key]) {
                            // Coba temukan kunci yang cocok dengan regex jika diperlukan, atau pemetaan manual.
                            // Untuk demo ini, kunci di apiDocs cocok dengan rute yang ditentukan secara kasar.
                        }

                        routeList.push({
                            method: methods,
                            path: fullPath,
                            group: name,
                            doc: apiDocs[key] || {}
                        });
                    }
                });
            }
        });
        return routeList;
    };

    const routes = getRoutes();
    const groupedRoutes = routes.reduce((acc, route) => {
        if (!acc[route.group]) acc[route.group] = [];
        acc[route.group].push(route);
        return acc;
    }, {});

    const menuItems = Object.keys(groupedRoutes).map(group =>
        `<a href="#${group}" class="nav-item">${group}</a>`
    ).join('');

    const contentHtml = Object.keys(groupedRoutes).map(group => `
        <div id="${group}" class="card">
            <div class="card-header">
                <h2 class="card-title">${group} Endpoints</h2>
            </div>
            <div class="card-body">
                <table class="endpoint-table">
                    <thead>
                        <tr>
                            <th style="width: 80px;">Method</th>
                            <th style="width: 120px;">Access</th>
                            <th>Endpoint</th>
                            <th style="width: 40%">Request Body / Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${groupedRoutes[group].map(route => {
        const hasBody = route.doc && route.doc.body;
        const bodyJson = hasBody ? JSON.stringify(route.doc.body, null, 2) : '';
        const description = route.doc.description || '';
        const access = route.doc.access || 'Authenticated';

        return `
                            <tr>
                                <td style="vertical-align: top;"><span class="method-badge ${route.method.toLowerCase()}">${route.method}</span></td>
                                <td style="vertical-align: top;"><span class="access-badge">${access}</span></td>
                                <td style="vertical-align: top;">
                                    <div class="endpoint-path">${route.path}</div>
                                    ${description ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${description}</div>` : ''}
                                </td>
                                <td style="vertical-align: top;">
                                    ${bodyJson ? `<div class="json-preview">${bodyJson}</div>` : '<span style="color: #999; font-size: 12px;">-</span>'}
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Documentation</title>
        <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fdfdfd; display: flex; min-height: 100vh; }
            
            /* Sidebar */
            .sidebar {
                width: 260px;
                background-color: #064e3b; /* Emerald 900 */
                color: white;
                display: flex;
                flex-direction: column;
                padding: 20px 0;
                position: fixed;
                height: 100vh;
                overflow-y: auto;
                box-shadow: 2px 0 5px rgba(0,0,0,0.1);
                z-index: 1000;
            }
            .brand {
                font-size: 22px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px solid #059669; /* Emerald 600 */
                letter-spacing: 0.5px;
                color: #ecfdf5;
            }
            .nav-item {
                padding: 12px 25px;
                color: #d1fae5; /* Emerald 100 */
                text-decoration: none;
                font-size: 14px;
                transition: all 0.2s;
                border-left: 4px solid transparent;
                display: block;
            }
            .nav-item:hover {
                background-color: #047857; /* Emerald 700 */
                color: white;
                border-left-color: #34d399; /* Emerald 400 */
            }
            
            /* Main */
            .main {
                margin-left: 260px;
                flex: 1;
                padding: 40px;
                width: calc(100% - 260px);
            }
            
            .card {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                overflow: hidden;
                border: 1px solid #e5e7eb;
                margin-bottom: 30px;
                scroll-margin-top: 20px;
            }
            .card-header {
                background-color: #fff;
                border-bottom: 2px solid #059669; /* Emerald 600 */
                padding: 15px 25px;
            }
            .card-title {
                margin: 0;
                font-size: 18px;
                color: #065f46; /* Emerald 800 */
                font-weight: 700;
            }
            .card-body {
                padding: 0;
            }
            
            /* Table */
            .endpoint-table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
            }
            .endpoint-table th {
                text-align: left;
                padding: 12px 25px;
                background-color: #f9fafb;
                color: #4b5563;
                font-size: 12px;
                text-transform: uppercase;
                border-bottom: 1px solid #e5e7eb;
            }
            .endpoint-table td {
                padding: 15px 25px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 14px;
                word-wrap: break-word;
            }
            .endpoint-table tr:last-child td {
                border-bottom: none;
            }
            .endpoint-table tr:hover {
                background-color: #f0fdf4; /* Light Green Hover */
            }
            
            /* Badges */
            .method-badge {
                display: inline-block;
                padding: 5px 10px;
                border-radius: 4px;
                font-weight: 700;
                font-size: 11px;
                color: white;
                min-width: 60px;
                text-align: center;
            }
            .method-badge { background-color: #059669; } /* GET/Default -> Emerald */
            .post { background-color: #dc2626; } /* POST -> Red */
            .put { background-color: #d97706; } /* PUT -> Amber/Orange for contrast */
            .delete { background-color: #b91c1c; }
            
            .access-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                background-color: #ecfdf5; /* Emerald 50 */
                color: #047857; /* Emerald 700 */
                font-size: 11px;
                font-weight: 600;
                border: 1px solid #a7f3d0;
            }

            .endpoint-path {
                font-family: 'Consolas', 'Monaco', monospace;
                color: #1f2937;
                font-weight: 600;
            }
            
            .json-preview {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                padding: 10px;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 12px;
                color: #065f46;
                white-space: pre-wrap;
                max-width: 100%;
                overflow-x: auto;
            }

            .debug-section {
                margin-bottom: 40px;
                border: 1px solid #a7f3d0;
                background-color: #ecfdf5;
            }
             .debug-section .card-header {
                background-color: #d1fae5;
                border-bottom: none;
             }
             .debug-section .card-title {
                color: #065f46;
             }
             
             .json-box {
                background-color: #fff;
                padding: 15px;
                border: 1px solid #a7f3d0;
                border-radius: 4px;
                font-family: monospace;
                white-space: pre-wrap;
                margin: 10px 25px 25px 25px;
                font-size: 13px;
                color: #047857;
             }
        </style>
    </head>
    <body>
        <div class="sidebar">
            <div class="brand">CRONOS API</div>
            <a href="#debug" class="nav-item">Current Request</a>
            <div style="margin-top: 10px; border-top: 1px solid #059669; padding-top: 10px;"></div>
            ${menuItems}
        </div>

        <div class="main">
            <!-- Info Debug -->
            <div id="debug" class="card debug-section">
                <div class="card-header">
                    <h2 class="card-title">Request Debugger</h2>
                </div>
                <div style="padding: 20px 25px 0;">
                     <div style="margin-bottom: 5px; font-weight: bold; color: #dc2626;">${req.method} <span style="color: #374151; font-weight: normal;">${fullUrl}</span></div>
                </div>
                <div class="json-box">${JSON.stringify(req.body, null, 4)}</div>
            </div>

            <!-- Daftar API -->
            ${contentHtml}
        </div>
    </body>
    </html>
    `;
    res.send(html);
});

// Sinkronkan Database dan Mulai Server
const PORT = process.env.PORT || 9000;

sequelize.sync({ alter: true })
    .then(async () => {
        console.log('Database synced successfully.');

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to sync database:', err);
    });

export default app;
