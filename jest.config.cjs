/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    transformIgnorePatterns: [
        '/node_modules/'
    ],
    moduleFileExtensions: ['js', 'json'],
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js',
        '!src/config/**'
    ],
    coverageDirectory: 'coverage',
    verbose: true,
    testTimeout: 15000,
    // Remove setupFilesAfterEnv to avoid ESM issues
    // setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};

module.exports = config;
