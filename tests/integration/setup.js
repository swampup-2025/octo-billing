const { GenericContainer } = require('@testcontainers/core');
const path = require('path');

// Global container reference for cleanup
global.testContainers = [];

// Setup function to be called before all tests
beforeAll(async () => {
  console.log('🚀 Setting up integration test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0'; // Let the system assign a random port
  
  console.log('✅ Integration test environment setup complete');
});

// Teardown function to be called after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...');
  
  // Clean up any remaining containers
  if (global.testContainers && global.testContainers.length > 0) {
    await Promise.all(global.testContainers.map(container => container.stop()));
  }
  
  console.log('✅ Integration test environment cleanup complete');
});

// Helper function to register containers for cleanup
global.registerContainer = (container) => {
  if (!global.testContainers) {
    global.testContainers = [];
  }
  global.testContainers.push(container);
};
