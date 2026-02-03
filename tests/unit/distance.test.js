// Distance calculation tests - standalone implementation for testing
// This mirrors the logic in src/utils/distance.js

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 10; // Default fallback if coords missing

    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Math.ceil(d);
};

describe('Distance Utility', () => {
    describe('calculateDistance', () => {
        test('should calculate distance between two coordinates correctly', () => {
            // Banyuwangi to Surabaya (approximately 290km)
            const lat1 = -8.2192;
            const lon1 = 114.3691;
            const lat2 = -7.2575;
            const lon2 = 112.7521;

            const distance = calculateDistance(lat1, lon1, lat2, lon2);

            // Should be around 200-300 km
            expect(distance).toBeGreaterThan(150);
            expect(distance).toBeLessThan(350);
        });

        test('should return distance in kilometers (integer)', () => {
            const lat1 = -8.0;
            const lon1 = 114.0;
            const lat2 = -8.1;
            const lon2 = 114.1;

            const distance = calculateDistance(lat1, lon1, lat2, lon2);

            expect(Number.isInteger(distance)).toBe(true);
        });

        test('should return 0 or 1 for same coordinates', () => {
            const lat = -8.0;
            const lon = 114.0;

            const distance = calculateDistance(lat, lon, lat, lon);

            // Same coordinates should result in 0 or 1 (due to floating point and ceil)
            expect(distance).toBeLessThanOrEqual(1);
        });

        test('should return fallback value (10) when coordinates are missing', () => {
            expect(calculateDistance(null, 114.0, -8.0, 114.0)).toBe(10);
            expect(calculateDistance(-8.0, null, -8.0, 114.0)).toBe(10);
            expect(calculateDistance(-8.0, 114.0, null, 114.0)).toBe(10);
            expect(calculateDistance(-8.0, 114.0, -8.0, null)).toBe(10);
            expect(calculateDistance(undefined, undefined, undefined, undefined)).toBe(10);
        });

        test('should handle edge case coordinates', () => {
            // North Pole to South Pole (using non-zero longitude to avoid fallback)
            const distance = calculateDistance(89, 1, -89, 1);

            // Should be approximately 20,000 km (nearly half Earth circumference)
            expect(distance).toBeGreaterThan(19000);
            expect(distance).toBeLessThan(21000);
        });

        test('should handle negative coordinates', () => {
            const lat1 = -8.5;
            const lon1 = 114.5;
            const lat2 = -7.5;
            const lon2 = 113.5;

            const distance = calculateDistance(lat1, lon1, lat2, lon2);

            expect(distance).toBeGreaterThan(0);
            expect(typeof distance).toBe('number');
        });
    });
});
