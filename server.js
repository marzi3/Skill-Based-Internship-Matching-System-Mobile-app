require('dotenv').config();
const dns = require('dns');

// Force use of Google DNS is disabled as it was causing timeouts on this network.
// dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const app = require('./src/app');
const { connectDB, initializeDatabase } = require('./src/config/database');
const User = require('./src/models/User'); // Load User model
const http = require('http');
const { initializeSocket } = require('./src/config/socket');

const PORT = process.env.PORT || 5000;

// Create HTTP server instance attached to Express
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Connect to MongoDB and initialize database
connectDB()
  .then(async () => {
    // Initialize database and create collections automatically
    await initializeDatabase();

    // Start the server using the HTTP server instead of Express app directly
    server.listen(PORT, () => {
      console.log(`✓ Server started on port ${PORT}`);
      console.log(`✓ Database connected`);
      console.log(`✓ WebSocket server initialized`);
    });
  })
  .catch((error) => {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  });