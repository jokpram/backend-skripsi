# CRONOS Backend Service

Express.js backend for CRONOS (Crustacean Origin Network Oversight System).

## Tech Stack
- Node.js (ESM)
- Express.js
- PostgreSQL (Sequelize)
- JWT Auth
- Midtrans Payment
- Multer Uploads

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   Check `.env` file for database and API keys.

3. **Run**
   ```bash
   npm run dev
   ```

## API Documentation

### Auth
- `POST /api/auth/register/admin`
- `POST /api/auth/register/petambak`
- `POST /api/auth/register/logistik`
- `POST /api/auth/register/konsumen`
- `POST /api/auth/login/[role]`
- `GET /api/auth/profile` (Auth required)

### Tambak & Batch (Petambak)
- `POST /api/tambak` - Create Tambak
- `GET /api/tambak` - List Tambaks
- `POST /api/tambak/batch` - Create Batch (Capacity Checked, Hash Generated)
- `GET /api/tambak/batch` - List Batches (Integrity Checked)

### Products
- `POST /api/products` - Create Product (Petambak)
- `GET /api/products` - List Products (Public)

### Orders & Logistics
- `POST /api/orders` - Create Order (Konsumen)
- `POST /api/orders/payment/token` - Get Midtrans Token
- `POST /api/orders/payment/notification` - Midtrans Webhook
- `GET /api/orders/:orderId/qr` - Get QR Code (Role based: Pickup/Receive)
- `POST /api/orders/scan/pickup` - Logistics scans Pickup QR
- `POST /api/orders/scan/receive` - Konsumen scans Receive QR (Completes Order & Releases Funds)

## Logic Highlights
- **Distance**: Calculated using Haversine from Tambak to Konsumen coords. Cost: 10k/5km.
- **Traceability**: Batch data hashed with SHA256. `getBatches` verifies integrity.
- **Escrow**: Funds held in Admin Wallet until `scan/receive` is successful.
- **Wallets**: System automatically credits Petambak/Logistik and debits Admin upon completion.
