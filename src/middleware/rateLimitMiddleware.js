import rateLimit from 'express-rate-limit';

// Pembatas kecepatan global: 50 permintaan per menit per IP
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 menit
    max: 50, // Maksimal 50 request per IP per menit
    standardHeaders: true, // Mengirim info rate limit di header `RateLimit-*`
    legacyHeaders: false, // Nonaktifkan header `X-RateLimit-*`
    message: {
        success: false,
        message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 1 menit.',
    },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json(options.message);
    },
});

// Pembatas lebih ketat untuk rute otentikasi: 10 permintaan per menit
const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 menit
    max: 10, // Maksimal 10 request per IP per menit
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Terlalu banyak percobaan login/register, silakan coba lagi setelah 1 menit.',
    },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json(options.message);
    },
});

export { globalLimiter, authLimiter };
