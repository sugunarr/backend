require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializePool, closePool } = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');
const overviewRoutes = require('./src/routes/overview');
const ticketsRoutes = require('./src/routes/tickets');
const logsRoutes = require('./src/routes/logs');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Request logging middleware (basic)
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Root API index - helpful for browsers and quick checks
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Payment Support Ops API',
    health: '/health',
    endpoints: ['/api/overview/summary', '/api/tickets', '/api/logs/errors/top'],
  });
});

/**
 * API Routes
 */
app.use('/api/overview', overviewRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/logs', logsRoutes);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.path} not found`,
  });
});

/**
 * Error handling middleware (must be last)
 */
app.use(errorHandler);

/**
 * Initialize database and start server
 */
async function start() {
  try {
    console.log('Initializing database pool...');
    // Initialize database pool
    await initializePool();
    console.log('✓ Database pool initialized');

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Database type: ${process.env.DB_TYPE || 'mssql'}\n`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nShutting down gracefully...');
      await closePool();
      server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down...');
      await closePool();
      server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('\n✗ Failed to start server:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

start();

module.exports = app;
