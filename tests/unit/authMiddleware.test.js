// Auth middleware tests - standalone implementation
const jwt = require('jsonwebtoken');

// Mock environment variable
process.env.JWT_SECRET = 'test-secret-key';

// Standalone middleware implementation for testing
const verifyToken = (req, res, next) => {
    const authHeader = req.header ? req.header('Authorization') : req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};

describe('Auth Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
            header: jest.fn((name) => mockRequest.headers[name.toLowerCase()])
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        nextFunction = jest.fn();
    });

    describe('verifyToken', () => {
        test('should call next() when valid token is provided', () => {
            const token = jwt.sign({ id: 1, role: 'petambak' }, process.env.JWT_SECRET);
            mockRequest.headers['authorization'] = `Bearer ${token}`;

            verifyToken(mockRequest, mockResponse, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect(mockRequest.user).toBeDefined();
            expect(mockRequest.user.id).toBe(1);
            expect(mockRequest.user.role).toBe('petambak');
        });

        test('should return 401 when no token is provided', () => {
            verifyToken(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No token provided' });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        test('should return 401 when invalid token is provided', () => {
            mockRequest.headers['authorization'] = 'Bearer invalid-token';

            verifyToken(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid token' });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        test('should return 401 when token is expired', () => {
            const expiredToken = jwt.sign(
                { id: 1, role: 'petambak' },
                process.env.JWT_SECRET,
                { expiresIn: '-1h' }
            );
            mockRequest.headers['authorization'] = `Bearer ${expiredToken}`;

            verifyToken(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(nextFunction).not.toHaveBeenCalled();
        });

        test('should handle token without Bearer prefix', () => {
            mockRequest.headers['authorization'] = 'some-token-without-bearer';

            verifyToken(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });
    });

    describe('authorizeRoles', () => {
        test('should call next() when user has allowed role', () => {
            mockRequest.user = { id: 1, role: 'admin' };
            const middleware = authorizeRoles('admin', 'petambak');

            middleware(mockRequest, mockResponse, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
        });

        test('should return 403 when user role is not allowed', () => {
            mockRequest.user = { id: 1, role: 'konsumen' };
            const middleware = authorizeRoles('admin', 'petambak');

            middleware(mockRequest, mockResponse, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access denied' });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        test('should allow multiple roles', () => {
            const middleware = authorizeRoles('admin', 'petambak', 'logistik');

            // Test admin
            mockRequest.user = { id: 1, role: 'admin' };
            middleware(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();

            // Reset
            nextFunction.mockClear();

            // Test petambak
            mockRequest.user = { id: 2, role: 'petambak' };
            middleware(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();

            // Reset
            nextFunction.mockClear();

            // Test logistik
            mockRequest.user = { id: 3, role: 'logistik' };
            middleware(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });

        test('should handle single role', () => {
            mockRequest.user = { id: 1, role: 'admin' };
            const middleware = authorizeRoles('admin');

            middleware(mockRequest, mockResponse, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
        });
    });
});
