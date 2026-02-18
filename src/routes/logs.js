const express = require('express');
const router = express.Router();
const { asyncHandler, parseDate } = require('../utils/helpers');
const logsController = require('../controllers/logsController');

/**
 * GET /api/logs/errors/top
 * Get top error signatures with counts
 */
router.get('/errors/top', asyncHandler(async (req, res) => {
  const { from, to, service } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      error: 'Bad request',
      message: 'Missing required parameters: from and to (ISO 8601 format)',
    });
  }

  try {
    const fromDate = parseDate(from);
    const toDate = parseDate(to);

    if (fromDate >= toDate) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Parameter "from" must be before "to"',
      });
    }

    const errors = await logsController.getTopErrors(fromDate, toDate, service);

    res.json({
      success: true,
      data: errors.map((error) => ({
        errorSignature: error.error_signature,
        serviceName: error.service_name,
        errorCount: error.error_count,
        lastOccurrence: error.last_occurrence,
        daysWithErrors: error.days_with_errors,
      })),
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * GET /api/logs/latency/trend
 * Get p95 latency trend over time
 */
router.get('/latency/trend', asyncHandler(async (req, res) => {
  const { from, to, service, endpoint } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      error: 'Bad request',
      message: 'Missing required parameters: from and to (ISO 8601 format)',
    });
  }

  try {
    const fromDate = parseDate(from);
    const toDate = parseDate(to);

    if (fromDate >= toDate) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Parameter "from" must be before "to"',
      });
    }

    const trend = await logsController.getLatencyTrend(fromDate, toDate, service, endpoint);

    res.json({
      success: true,
      data: trend.map((row) => ({
        hourStart: row.hour_start,
        serviceName: row.service_name,
        endpoint: row.endpoint,
        p95LatencyMs: row.p95_latency_ms,
        avgLatencyMs: row.avg_latency_ms,
        maxLatencyMs: row.max_latency_ms,
        requestCount: row.request_count,
      })),
    });
  } catch (error) {
    throw error;
  }
}));

module.exports = router;
