const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  
  console.log('Test database connected');
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close mongoose connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop the in-memory MongoDB instance
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('Test database disconnected');
});

// Mock Redis client
jest.mock('../utils/redisClient', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  isConnected: true
}));

// Mock PubSub Manager
jest.mock('../utils/pubSubManager', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  publishEnrollment: jest.fn().mockResolvedValue(true),
  publishModuleCompletion: jest.fn().mockResolvedValue(true),
  publishProgressUpdate: jest.fn().mockResolvedValue(true)
}));

// Mock Email Queue
jest.mock('../utils/emailQueue', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
  sendVerificationEmail: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  getStats: jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0
  })
}));

// Mock WebSocket Manager
jest.mock('../utils/webSocketManager', () => ({
  initialize: jest.fn(),
  emitToUser: jest.fn(),
  getOnlineUsersCount: jest.fn().mockReturnValue(0),
  io: null
}));
