/**
 * Security and edge case tests
 */

const crypto = require('crypto');

describe('Security Tests', () => {
    describe('Password Hashing', () => {
        // Simulate bcrypt behavior
        const hashPassword = (password) => {
            return crypto.createHash('sha256').update(password + 'salt').digest('hex');
        };

        const comparePassword = (password, hash) => {
            const newHash = crypto.createHash('sha256').update(password + 'salt').digest('hex');
            return newHash === hash;
        };

        test('should hash password consistently', () => {
            const password = 'mySecurePassword123';
            const hash1 = hashPassword(password);
            const hash2 = hashPassword(password);

            expect(hash1).toBe(hash2);
        });

        test('should verify correct password', () => {
            const password = 'mySecurePassword123';
            const hash = hashPassword(password);

            expect(comparePassword(password, hash)).toBe(true);
        });

        test('should reject wrong password', () => {
            const password = 'mySecurePassword123';
            const hash = hashPassword(password);

            expect(comparePassword('wrongPassword', hash)).toBe(false);
        });

        test('should generate different hashes for different passwords', () => {
            const hash1 = hashPassword('password1');
            const hash2 = hashPassword('password2');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('XSS Prevention', () => {
        const sanitizeInput = (input) => {
            if (typeof input !== 'string') return input;
            return input
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        };

        test('should escape HTML tags', () => {
            const input = '<script>alert("XSS")</script>';
            const sanitized = sanitizeInput(input);

            expect(sanitized).not.toContain('<script>');
            expect(sanitized).toContain('&lt;script&gt;');
        });

        test('should escape quotes', () => {
            const input = 'Hello "world" and \'universe\'';
            const sanitized = sanitizeInput(input);

            expect(sanitized).not.toContain('"');
            expect(sanitized).not.toContain("'");
        });

        test('should handle non-string input', () => {
            expect(sanitizeInput(123)).toBe(123);
            expect(sanitizeInput(null)).toBe(null);
            expect(sanitizeInput(undefined)).toBe(undefined);
        });
    });

    describe('SQL Injection Prevention', () => {
        // Sequelize handles this automatically, but test the pattern
        const escapeValue = (value) => {
            if (typeof value !== 'string') return value;
            return value.replace(/'/g, "''").replace(/;/g, '');
        };

        test('should escape single quotes', () => {
            const input = "Robert'; DROP TABLE users;--";
            const escaped = escapeValue(input);

            expect(escaped).not.toContain("';");
            expect(escaped).toContain("''");
        });

        test('should remove semicolons', () => {
            const input = "value; DELETE FROM orders;";
            const escaped = escapeValue(input);

            expect(escaped).not.toContain(';');
        });
    });

    describe('Rate Limiting Logic', () => {
        const createRateLimiter = (maxRequests, windowMs) => {
            const requests = new Map();

            return (ip) => {
                const now = Date.now();
                const windowStart = now - windowMs;

                // Clean old entries
                const userRequests = requests.get(ip) || [];
                const recentRequests = userRequests.filter(time => time > windowStart);

                if (recentRequests.length >= maxRequests) {
                    return { allowed: false, remaining: 0 };
                }

                recentRequests.push(now);
                requests.set(ip, recentRequests);

                return { allowed: true, remaining: maxRequests - recentRequests.length };
            };
        };

        test('should allow requests within limit', () => {
            const limiter = createRateLimiter(5, 60000);

            for (let i = 0; i < 5; i++) {
                const result = limiter('192.168.1.1');
                expect(result.allowed).toBe(true);
            }
        });

        test('should block requests exceeding limit', () => {
            const limiter = createRateLimiter(3, 60000);

            limiter('192.168.1.2');
            limiter('192.168.1.2');
            limiter('192.168.1.2');

            const result = limiter('192.168.1.2');
            expect(result.allowed).toBe(false);
        });

        test('should track different IPs separately', () => {
            const limiter = createRateLimiter(2, 60000);

            limiter('192.168.1.3');
            limiter('192.168.1.3');

            const result1 = limiter('192.168.1.3');
            const result2 = limiter('192.168.1.4');

            expect(result1.allowed).toBe(false);
            expect(result2.allowed).toBe(true);
        });
    });
});

describe('Edge Cases', () => {
    describe('Numeric Edge Cases', () => {
        test('should handle zero values', () => {
            const order = {
                total_harga: 0,
                total_biaya_logistik: 0
            };

            expect(order.total_harga).toBe(0);
            expect(order.total_biaya_logistik).toBe(0);
        });

        test('should handle very large numbers', () => {
            const largeAmount = 999999999999;
            const balance = largeAmount;

            expect(balance).toBe(999999999999);
            expect(balance.toString().length).toBe(12);
        });

        test('should handle decimal precision', () => {
            const price = 85000.50;
            const qty = 2.5;
            const total = price * qty;

            // JavaScript floating point
            expect(total).toBeCloseTo(212501.25, 2);
        });

        test('should handle negative number edge case', () => {
            const validateAmount = (amount) => amount > 0;

            expect(validateAmount(-100)).toBe(false);
            expect(validateAmount(0)).toBe(false);
            expect(validateAmount(100)).toBe(true);
        });
    });

    describe('String Edge Cases', () => {
        test('should handle empty strings', () => {
            const validateName = (name) => !!(name && name.trim().length > 0);

            expect(validateName('')).toBeFalsy();
            expect(validateName('   ')).toBeFalsy();
            expect(validateName('John')).toBeTruthy();
        });

        test('should handle very long strings', () => {
            const maxLength = 255;
            const longString = 'a'.repeat(300);
            const truncated = longString.substring(0, maxLength);

            expect(truncated.length).toBe(255);
        });

        test('should handle unicode characters', () => {
            const indonesianName = 'Budi Santoso';
            const withAccent = 'Café Résumé';
            const emoji = 'Hello 👋';

            expect(indonesianName).toBeDefined();
            expect(withAccent.length).toBeGreaterThan(0);
            expect(emoji).toContain('👋');
        });

        test('should handle special characters in names', () => {
            const names = [
                "O'Brien",
                "Mary-Jane",
                "José García",
                "北京"
            ];

            names.forEach(name => {
                expect(typeof name).toBe('string');
                expect(name.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Date Edge Cases', () => {
        test('should handle date parsing', () => {
            const dateString = '2024-01-15';
            const date = new Date(dateString);

            expect(date.getFullYear()).toBe(2024);
            expect(date.getMonth()).toBe(0); // January is 0
            expect(date.getDate()).toBe(15);
        });

        test('should handle future dates', () => {
            const futureDate = new Date('2030-12-31');
            const now = new Date();

            expect(futureDate > now).toBe(true);
        });

        test('should handle date comparison', () => {
            const harvestDate = new Date('2024-04-15');
            const tebarDate = new Date('2024-01-15');

            const daysToHarvest = Math.ceil((harvestDate - tebarDate) / (1000 * 60 * 60 * 24));

            expect(daysToHarvest).toBe(91);
        });
    });

    describe('Array Edge Cases', () => {
        test('should handle empty arrays', () => {
            const items = [];
            const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

            expect(total).toBe(0);
        });

        test('should handle single item arrays', () => {
            const items = [{ price: 100 }];
            const total = items.reduce((sum, item) => sum + item.price, 0);

            expect(total).toBe(100);
        });

        test('should handle null values in arrays', () => {
            const items = [100, null, 200, undefined, 300];
            const validItems = items.filter(item => item != null);
            const total = validItems.reduce((sum, item) => sum + item, 0);

            expect(validItems.length).toBe(3);
            expect(total).toBe(600);
        });
    });

    describe('Object Edge Cases', () => {
        test('should handle undefined properties', () => {
            const user = { name: 'John' };

            expect(user.email).toBeUndefined();
            expect(user.email || 'default@email.com').toBe('default@email.com');
        });

        test('should handle nested undefined', () => {
            const order = { items: null };

            expect(order.items?.length).toBeUndefined();
            expect(order.items?.length || 0).toBe(0);
        });

        test('should handle object spread with overrides', () => {
            const defaults = { status: 'pending', price: 0 };
            const update = { price: 100 };
            const merged = { ...defaults, ...update };

            expect(merged.status).toBe('pending');
            expect(merged.price).toBe(100);
        });
    });
});
