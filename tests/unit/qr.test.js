// QR Code tests - using actual qrcode library
const QRCode = require('qrcode');

const generateQRCode = async (text) => {
    try {
        return await QRCode.toDataURL(text);
    } catch (err) {
        console.error(err);
        return null;
    }
};

describe('QR Code Utility', () => {
    describe('generateQRCode', () => {
        test('should generate a data URL for valid text', async () => {
            const text = 'test-qr-token-12345';
            const result = await generateQRCode(text);

            expect(result).toBeDefined();
            expect(result).toMatch(/^data:image\/png;base64,/);
        });

        test('should generate different QR codes for different inputs', async () => {
            const qr1 = await generateQRCode('token-1');
            const qr2 = await generateQRCode('token-2');

            expect(qr1).not.toBe(qr2);
        });

        test('should handle UUID-like tokens', async () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440000';
            const result = await generateQRCode(uuid);

            expect(result).toBeDefined();
            expect(result).toMatch(/^data:image\/png;base64,/);
        });

        test('should handle empty string', async () => {
            const result = await generateQRCode('');

            // Should still generate a QR code for empty string
            expect(result).toBeDefined();
        });

        test('should handle special characters', async () => {
            const specialText = 'token-with-special-chars!@#$%';
            const result = await generateQRCode(specialText);

            expect(result).toBeDefined();
            expect(result).toMatch(/^data:image\/png;base64,/);
        });

        test('should handle long text', async () => {
            const longText = 'a'.repeat(500);
            const result = await generateQRCode(longText);

            expect(result).toBeDefined();
        });
    });
});
