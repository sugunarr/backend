/**
 * Error handling middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Database-specific errors
  if (err.message && err.message.includes('Login failed')) {
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: 'Unable to connect to database. Please check your credentials.',
    });
  }

  if (err.message && err.message.includes('Timeout')) {
    return res.status(504).json({
      success: false,
      error: 'Request timeout',
      message: 'Database query exceeded timeout limit',
    });
  }

  // Validation errors
  if (err.status === 400) {
    return res.status(400).json({
      success: false,
      error: 'Bad request',
      message: err.message,
    });
  }

  // Not found errors
  if (err.status === 404) {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: err.message,
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
}

module.exports = errorHandler;
