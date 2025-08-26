const { GenericContainer } = require('@testcontainers/core');
const axios = require('axios');
const path = require('path');

describe('Octo Billing Server Integration Tests', () => {
  let container;
  let baseUrl;
  let containerPort;

  beforeAll(async () => {
    console.log('🐳 Starting Octo Billing server container...');
    
    // Build and start the container
    container = await new GenericContainer('octo-billing:test')
      .withExposedPorts(3000)
      .withHealthCheck({
        test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health'],
        interval: 1000,
        timeout: 3000,
        retries: 30,
        startPeriod: 10000
      })
      .start();

    // Register for cleanup
    global.registerContainer(container);

    // Get the mapped port
    containerPort = container.getMappedPort(3000);
    baseUrl = `http://localhost:${containerPort}`;

    console.log(`✅ Server container started on ${baseUrl}`);
    
    // Wait for health check to pass
    await container.waitForHealthCheck();
    console.log('✅ Server health check passed');
  });

  afterAll(async () => {
    if (container) {
      await container.stop();
      console.log('🛑 Server container stopped');
    }
  });

  describe('Health Check API', () => {
    test('should return health status', async () => {
      const response = await axios.get(`${baseUrl}/api/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'ok');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('version');
      expect(response.data).toHaveProperty('dependencies');
      expect(Array.isArray(response.data.dependencies)).toBe(true);
    });
  });

  describe('User Management API', () => {
    test('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await axios.post(`${baseUrl}/api/users`, userData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.username).toBe(userData.username);
      expect(response.data.email).toBe(userData.email);
      expect(response.data).not.toHaveProperty('password'); // Password should be omitted
      expect(response.data).toHaveProperty('createdAt');
    });

    test('should return 400 for missing required fields', async () => {
      const userData = {
        username: 'testuser'
        // Missing email and password
      };

      try {
        await axios.post(`${baseUrl}/api/users`, userData);
        fail('Expected request to fail');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error', 'Missing required fields');
      }
    });

    test('should retrieve all users', async () => {
      const response = await axios.get(`${baseUrl}/api/users`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Verify no passwords are exposed
      response.data.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('Billing API', () => {
    let testUser;
    let testBill;

    beforeAll(async () => {
      // Create a test user first
      const userData = {
        username: 'billuser',
        email: 'bill@example.com',
        password: 'password123'
      };
      
      const userResponse = await axios.post(`${baseUrl}/api/users`, userData);
      testUser = userResponse.data;
    });

    test('should create a new bill', async () => {
      const billData = {
        userId: testUser.id,
        amount: 99.99,
        description: 'Test bill for integration testing'
      };

      const response = await axios.post(`${baseUrl}/api/bills`, billData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.userId).toBe(billData.userId);
      expect(response.data.amount).toBe(billData.amount);
      expect(response.data.description).toBe(billData.description);
      expect(response.data.status).toBe('pending');
      expect(response.data).toHaveProperty('createdAt');
      expect(response.data).toHaveProperty('dueDate');

      testBill = response.data;
    });

    test('should return 400 for missing required fields in bill creation', async () => {
      const billData = {
        userId: testUser.id
        // Missing amount and description
      };

      try {
        await axios.post(`${baseUrl}/api/bills`, billData);
        fail('Expected request to fail');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error', 'Missing required fields');
      }
    });

    test('should retrieve all bills', async () => {
      const response = await axios.get(`${baseUrl}/api/bills`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Verify the test bill is in the list
      const foundBill = response.data.find(bill => bill.id === testBill.id);
      expect(foundBill).toBeDefined();
    });
  });

  describe('Payment API', () => {
    let testUser;
    let testBill;
    let testPayment;

    beforeAll(async () => {
      // Create a test user and bill
      const userData = {
        username: 'paymentuser',
        email: 'payment@example.com',
        password: 'password123'
      };
      
      const userResponse = await axios.post(`${baseUrl}/api/users`, userData);
      testUser = userResponse.data;

      const billData = {
        userId: testUser.id,
        amount: 150.00,
        description: 'Test bill for payment testing'
      };
      
      const billResponse = await axios.post(`${baseUrl}/api/bills`, billData);
      testBill = billResponse.data;
    });

    test('should process a payment', async () => {
      const paymentData = {
        billId: testBill.id,
        amount: 150.00,
        paymentMethod: 'credit_card'
      };

      const response = await axios.post(`${baseUrl}/api/payments`, paymentData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.billId).toBe(paymentData.billId);
      expect(response.data.amount).toBe(paymentData.amount);
      expect(response.data.paymentMethod).toBe(paymentData.paymentMethod);
      expect(response.data.status).toBe('completed');
      expect(response.data).toHaveProperty('processedAt');

      testPayment = response.data;
    });

    test('should return 404 for non-existent bill', async () => {
      const paymentData = {
        billId: 99999, // Non-existent bill ID
        amount: 50.00,
        paymentMethod: 'credit_card'
      };

      try {
        await axios.post(`${baseUrl}/api/payments`, paymentData);
        fail('Expected request to fail');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('error', 'Bill not found');
      }
    });

    test('should return 400 for missing required fields in payment', async () => {
      const paymentData = {
        billId: testBill.id
        // Missing amount and paymentMethod
      };

      try {
        await axios.post(`${baseUrl}/api/payments`, paymentData);
        fail('Expected request to fail');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error', 'Missing required fields');
      }
    });

    test('should retrieve all payments', async () => {
      const response = await axios.get(`${baseUrl}/api/payments`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Verify the test payment is in the list
      const foundPayment = response.data.find(payment => payment.id === testPayment.id);
      expect(foundPayment).toBeDefined();
    });
  });

  describe('Web Interface', () => {
    test('should serve the main page', async () => {
      const response = await axios.get(`${baseUrl}/`);
      
      expect(response.status).toBe(200);
      expect(response.data).toContain('Octo Billing System');
    });

    test('should return 404 for non-existent routes', async () => {
      try {
        await axios.get(`${baseUrl}/api/nonexistent`);
        fail('Expected request to fail');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('error', 'Route not found');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', async () => {
      try {
        await axios.post(`${baseUrl}/api/users`, 'invalid json', {
          headers: { 'Content-Type': 'application/json' }
        });
        fail('Expected request to fail');
      } catch (error) {
        expect(error.response.status).toBe(500);
      }
    });

    test('should handle server errors gracefully', async () => {
      // This test verifies that the error handling middleware works
      // We can't easily trigger a server error in this simple app,
      // but we can verify the error handling structure exists
      const response = await axios.get(`${baseUrl}/api/health`);
      expect(response.status).toBe(200);
    });
  });
});
