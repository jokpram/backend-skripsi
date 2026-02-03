const crypto = require('crypto');

// Helper function to test blockchain hash generation (similar to tambakController)
const generateBlockchainHash = (batch) => {
    const dataToHash = `${batch.tambak_id}${batch.tanggal_tebar}${batch.tanggal_panen || ''}${batch.kualitas_air_ph}${batch.kualitas_air_salinitas}`;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
};

// Helper function to verify integrity (similar to productController)
const verifyIntegrity = (batch, storedHash) => {
    const currentHash = generateBlockchainHash(batch);
    return currentHash === storedHash ? 'VALID' : 'DATA TAMPERED';
};

describe('Blockchain Hash Utility', () => {
    describe('generateBlockchainHash', () => {
        test('should generate a 64-character hex hash', () => {
            const batch = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-15',
                tanggal_panen: null,
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 25
            };

            const hash = generateBlockchainHash(batch);

            expect(hash).toBeDefined();
            expect(hash.length).toBe(64);
            expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
        });

        test('should generate same hash for same data', () => {
            const batch = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-15',
                tanggal_panen: '2024-04-15',
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 25
            };

            const hash1 = generateBlockchainHash(batch);
            const hash2 = generateBlockchainHash(batch);

            expect(hash1).toBe(hash2);
        });

        test('should generate different hash for different data', () => {
            const batch1 = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-15',
                tanggal_panen: null,
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 25
            };

            const batch2 = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-16', // Different date
                tanggal_panen: null,
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 25
            };

            const hash1 = generateBlockchainHash(batch1);
            const hash2 = generateBlockchainHash(batch2);

            expect(hash1).not.toBe(hash2);
        });

        test('should handle null tanggal_panen correctly', () => {
            const batchWithNull = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-15',
                tanggal_panen: null,
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 25
            };

            const batchWithEmpty = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-15',
                tanggal_panen: '',
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 25
            };

            const hash1 = generateBlockchainHash(batchWithNull);
            const hash2 = generateBlockchainHash(batchWithEmpty);

            // Both should treat null/undefined as empty string
            expect(hash1).toBe(hash2);
        });

        test('should be sensitive to small changes in pH', () => {
            const batch1 = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-15',
                tanggal_panen: null,
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 25
            };

            const batch2 = {
                ...batch1,
                kualitas_air_ph: 7.6 // Slightly different pH
            };

            const hash1 = generateBlockchainHash(batch1);
            const hash2 = generateBlockchainHash(batch2);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('verifyIntegrity', () => {
        test('should return VALID when hash matches', () => {
            const batch = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-15',
                tanggal_panen: null,
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 25
            };

            const storedHash = generateBlockchainHash(batch);
            const result = verifyIntegrity(batch, storedHash);

            expect(result).toBe('VALID');
        });

        test('should return DATA TAMPERED when hash does not match', () => {
            const originalBatch = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-15',
                tanggal_panen: null,
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 25
            };

            const storedHash = generateBlockchainHash(originalBatch);

            // Simulate data tampering
            const tamperedBatch = {
                ...originalBatch,
                kualitas_air_ph: 8.0 // Changed pH
            };

            const result = verifyIntegrity(tamperedBatch, storedHash);

            expect(result).toBe('DATA TAMPERED');
        });

        test('should detect tampering in any field', () => {
            const originalBatch = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-15',
                tanggal_panen: null,
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 25
            };

            const storedHash = generateBlockchainHash(originalBatch);

            // Test tampering each field
            const tamperTests = [
                { ...originalBatch, tambak_id: 2 },
                { ...originalBatch, tanggal_tebar: '2024-01-16' },
                { ...originalBatch, kualitas_air_salinitas: 26 }
            ];

            tamperTests.forEach(tamperedBatch => {
                expect(verifyIntegrity(tamperedBatch, storedHash)).toBe('DATA TAMPERED');
            });
        });
    });
});
