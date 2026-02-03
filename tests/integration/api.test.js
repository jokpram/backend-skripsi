/**
 * Integration tests for API endpoints
 * Uses supertest to simulate HTTP requests
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock Express app for testing
const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // Mock auth middleware
    const mockAuth = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        try {
            req.user = jwt.verify(token, 'test-secret');
            next();
        } catch (e) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };

    // Mock routes
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.get('/api/products', (req, res) => {
        res.json([
            { id: 1, jenis_udang: 'Vaname', grade: 'A', harga_per_kg: 85000, stok_kg: 100 },
            { id: 2, jenis_udang: 'Vaname', grade: 'B', harga_per_kg: 75000, stok_kg: 50 }
        ]);
    });

    app.get('/api/products/:id', (req, res) => {
        const id = parseInt(req.params.id);
        if (id === 1) {
            return res.json({ id: 1, jenis_udang: 'Vaname', grade: 'A', harga_per_kg: 85000, stok_kg: 100 });
        }
        res.status(404).json({ message: 'Product not found' });
    });

    app.post('/api/auth/login', (req, res) => {
        const { email, password } = req.body;
        if (email === 'test@example.com' && password === 'password123') {
            const token = jwt.sign({ id: 1, role: 'konsumen', email }, 'test-secret', { expiresIn: '1h' });
            return res.json({ token, user: { id: 1, email, role: 'konsumen' } });
        }
        res.status(401).json({ message: 'Invalid credentials' });
    });

    app.get('/api/wallet/my', mockAuth, (req, res) => {
        res.json({ id: 1, balance: 500000, owner_type: req.user.role.toUpperCase(), transactions: [] });
    });

    app.post('/api/orders', mockAuth, (req, res) => {
        const { items } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Items required' });
        }
        res.status(201).json({
            order: { id: 1, konsumen_id: req.user.id, status: 'PENDING', total_harga: 100000 },
            items,
            logistics: { distance: 10, cost: 20000 }
        });
    });

    return app;
};

describe('API Integration Tests', () => {
    let app;

    beforeAll(() => {
        app = createTestApp();
    });

    describe('Health Check', () => {
        test('GET /api/health should return status ok', async () => {
            const response = await request(app).get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('Products API', () => {
        test('GET /api/products should return product list', async () => {
            const response = await request(app).get('/api/products');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty('jenis_udang');
            expect(response.body[0]).toHaveProperty('harga_per_kg');
        });

        test('GET /api/products/:id should return single product', async () => {
            const response = await request(app).get('/api/products/1');

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(1);
            expect(response.body.jenis_udang).toBe('Vaname');
        });

        test('GET /api/products/:id should return 404 for non-existent product', async () => {
            const response = await request(app).get('/api/products/999');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Product not found');
        });
    });

    describe('Authentication API', () => {
        test('POST /api/auth/login should return token for valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe('test@example.com');
        });

        test('POST /api/auth/login should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'wrong@example.com', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid credentials');
        });
    });

    describe('Protected Routes', () => {
        let token;

        beforeAll(async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });
            token = loginResponse.body.token;
        });

        test('GET /api/wallet/my should return wallet for authenticated user', async () => {
            const response = await request(app)
                .get('/api/wallet/my')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.balance).toBeDefined();
            expect(response.body.owner_type).toBe('KONSUMEN');
        });

        test('GET /api/wallet/my should return 401 without token', async () => {
            const response = await request(app).get('/api/wallet/my');

            expect(response.status).toBe(401);
        });

        test('POST /api/orders should create order for authenticated user', async () => {
            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send({ items: [{ produk_id: 1, qty: 5 }] });

            expect(response.status).toBe(201);
            expect(response.body.order).toBeDefined();
            expect(response.body.order.status).toBe('PENDING');
            expect(response.body.logistics).toBeDefined();
        });

        test('POST /api/orders should return 400 without items', async () => {
            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send({ items: [] });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Items required');
        });
    });
});
