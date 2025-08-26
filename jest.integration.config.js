module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js'],
  testTimeout: 120000, // 2 minutes timeout for container startup
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'json'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports',
      outputName: 'integration-test-results.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],
  // Ensure Docker containers are properly cleaned up
  globalTeardown: '<rootDir>/tests/integration/teardown.js'
};
