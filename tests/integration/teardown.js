module.exports = async () => {
  console.log('🔚 Running global teardown for integration tests...');
  
  // Additional cleanup if needed
  if (global.testContainers && global.testContainers.length > 0) {
    console.log(`🧹 Stopping ${global.testContainers.length} test containers...`);
    await Promise.all(global.testContainers.map(container => container.stop()));
  }
  
  console.log('✅ Global teardown complete');
};
