# Unit Testing Documentation - Backend

## ✅ Test Results

```
Test Suites: 10 passed, 10 total
Tests:       131 passed, 131 total
Snapshots:   0 total
Time:        ~11 seconds
```

**All tests passing! ✓**

---

## Setup

Testing menggunakan **Jest** dengan **Babel** untuk transformasi ES modules.

### Dependencies
```bash
npm install --save-dev jest @babel/core @babel/preset-env @babel/plugin-transform-modules-commonjs babel-jest supertest
```

### Configuration Files

| File | Deskripsi |
|------|-----------|
| `babel.config.json` | Babel config untuk ESM transformation |
| `jest.config.cjs` | Jest configuration (CommonJS) |
| `.env.test` | Test environment variables |
| `tests/setup.js` | Jest setup file |

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests with verbose output
npm run test:verbose

# Run only unit tests
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

---

## Test Structure

```
backend/
├── tests/
│   ├── setup.js                  # Jest setup file
│   ├── README.md                 # This documentation
│   ├── __mocks__/
│   │   └── models.js             # Mock Sequelize models
│   ├── unit/                     # Unit tests (75+ tests)
│   │   ├── distance.test.js      # Haversine distance calculation
│   │   ├── qr.test.js            # QR code generation
│   │   ├── authMiddleware.test.js# JWT authentication
│   │   ├── blockchain.test.js    # SHA-256 hash integrity
│   │   ├── wallet.test.js        # Wallet business logic
│   │   ├── order.test.js         # Order business logic
│   │   ├── validation.test.js    # Input validation
│   │   ├── models.test.js        # Model definitions & relations
│   │   └── security.test.js      # Security & edge cases
│   └── integration/              # Integration tests (10+ tests)
│       └── api.test.js           # API endpoint tests
```

---

## Test Categories

### 1. Unit Tests (9 Files, 121 Tests)

#### Distance Utility (`distance.test.js`) - 6 tests
- Calculate distance between coordinates
- Return integer kilometers
- Handle same coordinates
- Fallback for missing coordinates
- Edge case coordinates (poles)
- Negative coordinates

#### QR Code Utility (`qr.test.js`) - 6 tests
- Generate valid data URL
- Different QR for different inputs
- Handle UUID tokens
- Handle empty strings
- Handle special characters
- Handle long text

#### Auth Middleware (`authMiddleware.test.js`) - 9 tests
- Verify valid token
- Reject missing token (401)
- Reject invalid token
- Reject expired token
- Handle token format errors
- Authorize correct roles
- Deny unauthorized roles
- Support multiple roles

#### Blockchain Hash (`blockchain.test.js`) - 8 tests
- Generate 64-char hex hash
- Consistent hashing
- Different data = different hash
- Handle null values
- Detect pH changes
- Verify integrity
- Detect tampering
- Multi-field tampering detection

#### Wallet Business Logic (`wallet.test.js`) - 14 tests
- Logistic fee calculation
- Admin fee calculation
- Petambak revenue calculation
- Order total calculation
- Fund distribution
- Transaction types (CREDIT/DEBIT)
- Balance calculations
- Withdrawal validation (negative, zero, insufficient)

#### Order Business Logic (`order.test.js`) - 18 tests
- Order status transitions
- Stock management validation
- Price calculations
- Multi-item order totals
- Delivery status transitions

#### Validation Helpers (`validation.test.js`) - 14 tests
- Email validation
- Phone number validation (Indonesia format)
- Password strength
- Tambak data validation
- Batch data validation (pH range)

#### Model Definitions (`models.test.js`) - 17 tests
- User model fields (Admin, Petambak, Logistik, Konsumen)
- Tambak model validation
- BatchUdang water quality validation
- Order model validation
- Delivery model QR tokens
- Wallet model validation
- Model relationships (1:N)

#### Security & Edge Cases (`security.test.js`) - 29 tests
- Password hashing
- XSS prevention
- SQL injection prevention
- Rate limiting logic
- Numeric edge cases (zero, large, decimal)
- String edge cases (empty, long, unicode)
- Date edge cases
- Array edge cases
- Object edge cases

### 2. Integration Tests (1 File, 10 Tests)

#### API Endpoints (`api.test.js`)
- Health check endpoint
- Products listing
- Single product fetch
- Product not found (404)
- Login with valid credentials
- Login with invalid credentials (401)
- Protected route with token
- Protected route without token (401)
- Create order
- Create order validation (400)

---

## Test Coverage by Feature

| Feature | Tests | Status |
|---------|-------|--------|
| Distance Calculation | 6 | ✅ |
| QR Code Generation | 6 | ✅ |
| JWT Authentication | 9 | ✅ |
| Blockchain Integrity | 8 | ✅ |
| Wallet/Escrow Logic | 14 | ✅ |
| Order Flow | 18 | ✅ |
| Input Validation | 14 | ✅ |
| Model Validation | 17 | ✅ |
| Security | 29 | ✅ |
| API Integration | 10 | ✅ |
| **TOTAL** | **131** | **✅** |

---

## Test Patterns Used

### 1. Arrange-Act-Assert (AAA)
```javascript
test('should calculate distance correctly', () => {
  // Arrange
  const lat1 = -8.2192, lon1 = 114.3691;
  const lat2 = -7.2575, lon2 = 112.7521;
  
  // Act
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  
  // Assert
  expect(distance).toBeGreaterThan(150);
});
```

### 2. Edge Case Testing
```javascript
test('should handle empty strings', () => {
  const validateName = (name) => !!(name && name.trim().length > 0);
  expect(validateName('')).toBeFalsy();
  expect(validateName('   ')).toBeFalsy();
});
```

### 3. Mock Testing
```javascript
const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
};
```

---

## Adding New Tests

1. Create test file in `tests/unit/` or `tests/integration/`
2. Use naming convention: `*.test.js`
3. Use `describe` blocks for grouping
4. Use `test` or `it` for individual tests
5. Run `npm test` to verify

Example:
```javascript
describe('MyFeature', () => {
  test('should do something', () => {
    expect(true).toBe(true);
  });
});
```

---

## Troubleshooting

### ESM Issues
If you encounter ESM import errors, ensure:
1. `babel.config.json` has correct presets
2. `jest.config.cjs` uses CommonJS format
3. Tests use `require()` for CommonJS modules

### Timeout Issues
Increase timeout in `setup.js`:
```javascript
jest.setTimeout(30000); // 30 seconds
```

---

## Best Practices

1. ✅ Keep tests isolated and independent
2. ✅ Use descriptive test names
3. ✅ Test edge cases and error conditions
4. ✅ Mock external dependencies
5. ✅ Follow AAA pattern
6. ✅ Run tests before committing
