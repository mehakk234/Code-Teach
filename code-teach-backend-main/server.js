const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

// Import utilities
const redisClient = require('./utils/redisClient');
const webSocketManager = require('./utils/webSocketManager');
const pubSubManager = require('./utils/pubSubManager');
const emailQueue = require('./utils/emailQueue');

const app = express();
const server = http.createServer(app);

// Simple CORS configuration - allow all origins
app.use(cors({
  origin: true, // Allow any origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'ngrok-skip-browser-warning',
    'Origin',
    'Accept',
    'X-Requested-With'
  ]
}));

app.use(express.json());

// Simple MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const redisStatus = redisClient.isConnected ? 'connected' : 'disconnected';
    const onlineUsers = webSocketManager.getOnlineUsersCount();
    const emailQueueStats = await emailQueue.getStats();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
        websocket: 'active',
        emailQueue: emailQueueStats
      },
      metrics: {
        onlineUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/admin', require('./routes/admin')); // Add admin routes

// Initialize admin user
const initializeAdmin = async () => {
  try {
    const User = require('./models/User');
    let admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!admin) {
      admin = new User({
        username: process.env.ADMIN_USERNAME,
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        isAdmin: true
      });
      await admin.save();
      console.log('Admin user created');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

// Initialize admin and start server
const PORT = process.env.PORT || 5000;

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  try {
    // Close WebSocket connections
    console.log('Closing WebSocket connections...');
    if (webSocketManager.io) {
      webSocketManager.io.close();
    }

    // Close Redis connections
    console.log('Closing Redis connections...');
    await redisClient.disconnect();
    await pubSubManager.disconnect();

    // Close email queue
    console.log('Closing email queue...');
    await emailQueue.close();

    // Close MongoDB connection
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();

    console.log('✅ All connections closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize all services
mongoose.connection.once('open', async () => {
  try {
    console.log('\n🚀 Initializing services...\n');

    // Initialize admin user
    await initializeAdmin();

    // Initialize Redis
    console.log('Initializing Redis...');
    await redisClient.connect();

    // Initialize PubSub
    console.log('Initializing PubSub...');
    await pubSubManager.connect();

    // Initialize Email Queue
    console.log('Initializing Email Queue...');
    await emailQueue.initialize();

    // Initialize WebSocket server
    console.log('Initializing WebSocket server...');
    webSocketManager.initialize(server);

    // Start server
    server.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ WebSocket server ready`);
      console.log(`✅ Redis connected and caching enabled`);
      console.log(`✅ Message queue active`);
      console.log(`✅ Pub/Sub system operational`);
      console.log('='.repeat(50) + '\n');
    });
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
});
