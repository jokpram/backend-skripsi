describe('Validation Helpers', () => {
    describe('Email Validation', () => {
        const isValidEmail = (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        };

        test('should accept valid email addresses', () => {
            expect(isValidEmail('user@example.com')).toBe(true);
            expect(isValidEmail('user.name@example.com')).toBe(true);
            expect(isValidEmail('user+tag@example.co.id')).toBe(true);
            expect(isValidEmail('user123@sub.example.com')).toBe(true);
        });

        test('should reject invalid email addresses', () => {
            expect(isValidEmail('')).toBe(false);
            expect(isValidEmail('invalid')).toBe(false);
            expect(isValidEmail('invalid@')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
            expect(isValidEmail('user@.com')).toBe(false);
            expect(isValidEmail('user name@example.com')).toBe(false);
        });
    });

    describe('Phone Number Validation', () => {
        const isValidPhone = (phone) => {
            if (!phone) return true; // Optional field
            const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
            return phoneRegex.test(phone.replace(/[\s-]/g, ''));
        };

        test('should accept valid Indonesian phone numbers', () => {
            expect(isValidPhone('081234567890')).toBe(true);
            expect(isValidPhone('6281234567890')).toBe(true);
            expect(isValidPhone('+6281234567890')).toBe(true);
            expect(isValidPhone('08123456789')).toBe(true);
        });

        test('should accept empty/null phone (optional field)', () => {
            expect(isValidPhone('')).toBe(true);
            expect(isValidPhone(null)).toBe(true);
            expect(isValidPhone(undefined)).toBe(true);
        });

        test('should reject invalid phone numbers', () => {
            expect(isValidPhone('123')).toBe(false);
            expect(isValidPhone('abcdefghijk')).toBe(false);
        });
    });

    describe('Password Strength', () => {
        const checkPasswordStrength = (password) => {
            if (!password || password.length < 6) {
                return { strong: false, message: 'Password must be at least 6 characters' };
            }
            if (password.length < 8) {
                return { strong: false, message: 'Password should be at least 8 characters for better security', acceptable: true };
            }
            return { strong: true };
        };

        test('should reject passwords shorter than 6 characters', () => {
            const result = checkPasswordStrength('12345');
            expect(result.strong).toBe(false);
            expect(result.acceptable).toBeUndefined();
        });

        test('should accept but warn for 6-7 character passwords', () => {
            const result = checkPasswordStrength('123456');
            expect(result.strong).toBe(false);
            expect(result.acceptable).toBe(true);
        });

        test('should accept 8+ character passwords as strong', () => {
            const result = checkPasswordStrength('password123');
            expect(result.strong).toBe(true);
        });

        test('should reject empty password', () => {
            const result = checkPasswordStrength('');
            expect(result.strong).toBe(false);
        });
    });

    describe('Tambak Validation', () => {
        const validateTambak = (data) => {
            const errors = [];

            if (!data.nama_tambak || data.nama_tambak.trim() === '') {
                errors.push('Nama tambak wajib diisi');
            }
            if (!data.lokasi || data.lokasi.trim() === '') {
                errors.push('Lokasi wajib diisi');
            }
            if (!data.luas_m2 || data.luas_m2 <= 0) {
                errors.push('Luas harus lebih dari 0');
            }
            if (!data.kapasitas_maks_kg || data.kapasitas_maks_kg <= 0) {
                errors.push('Kapasitas maksimal harus lebih dari 0');
            }

            return { valid: errors.length === 0, errors };
        };

        test('should accept valid tambak data', () => {
            const data = {
                nama_tambak: 'Tambak Sejahtera',
                lokasi: 'Banyuwangi',
                luas_m2: 1000,
                kapasitas_maks_kg: 5000
            };

            const result = validateTambak(data);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject missing nama_tambak', () => {
            const data = {
                nama_tambak: '',
                lokasi: 'Banyuwangi',
                luas_m2: 1000,
                kapasitas_maks_kg: 5000
            };

            const result = validateTambak(data);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Nama tambak wajib diisi');
        });

        test('should reject negative luas', () => {
            const data = {
                nama_tambak: 'Tambak',
                lokasi: 'Banyuwangi',
                luas_m2: -100,
                kapasitas_maks_kg: 5000
            };

            const result = validateTambak(data);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Luas harus lebih dari 0');
        });

        test('should collect multiple errors', () => {
            const data = {
                nama_tambak: '',
                lokasi: '',
                luas_m2: 0,
                kapasitas_maks_kg: -1
            };

            const result = validateTambak(data);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBe(4);
        });
    });

    describe('Batch Validation', () => {
        const validateBatch = (data) => {
            const errors = [];

            if (!data.tambak_id) {
                errors.push('Tambak ID wajib');
            }
            if (!data.tanggal_tebar) {
                errors.push('Tanggal tebar wajib diisi');
            }
            if (!data.kualitas_air_ph || data.kualitas_air_ph < 0 || data.kualitas_air_ph > 14) {
                errors.push('pH harus antara 0-14');
            }
            if (!data.kualitas_air_salinitas || data.kualitas_air_salinitas < 0) {
                errors.push('Salinitas harus positif');
            }
            if (!data.estimasi_panen_kg || data.estimasi_panen_kg <= 0) {
                errors.push('Estimasi panen harus lebih dari 0');
            }

            return { valid: errors.length === 0, errors };
        };

        test('should accept valid batch data', () => {
            const data = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-15',
                kualitas_air_ph: 7.5,
                kualitas_air_salinitas: 25,
                estimasi_panen_kg: 1000
            };

            const result = validateBatch(data);
            expect(result.valid).toBe(true);
        });

        test('should reject pH outside 0-14 range', () => {
            const data = {
                tambak_id: 1,
                tanggal_tebar: '2024-01-15',
                kualitas_air_ph: 15, // Invalid
                kualitas_air_salinitas: 25,
                estimasi_panen_kg: 1000
            };

            const result = validateBatch(data);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('pH harus antara 0-14');
        });
    });
});
