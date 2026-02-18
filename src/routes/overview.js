const express = require('express');
const router = express.Router();
const { asyncHandler, parseDate } = require('../utils/helpers');
const overviewController = require('../controllers/overviewController');

/**
 * GET /api/overview/summary
 * Executive summary with key metrics
 */
router.get('/summary', asyncHandler(async (req, res) => {
  const { from, to } = req.query;

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

    const summary = await overviewController.getSummary(fromDate, toDate);

    res.json({
      success: true,
      data: {
        totalTickets: summary?.total_tickets || 0,
        ticketsClosed: summary?.tickets_closed || 0,
        slaBreaches: summary?.sla_breaches || 0,
        avgFirstResponseSeconds: summary?.avg_first_response_seconds || null,
        p95FirstResponseSeconds: summary?.p95_first_response_seconds || null,
        totalErrorEvents: summary?.total_error_events || 0,
      },
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * GET /api/overview/support-trend
 * Daily ticket and SLA trends
 */
router.get('/support-trend', asyncHandler(async (req, res) => {
  const { from, to } = req.query;

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

    const trend = await overviewController.getSupportTrend(fromDate, toDate);

    res.json({
      success: true,
      data: trend.map((row) => ({
        date: row.date,
        ticketsCreated: row.tickets_created,
        ticketsClosed: row.tickets_closed,
        slaBreaches: row.sla_breaches,
      })),
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * GET /api/overview/service-trend
 * Daily service event and latency trends
 */
router.get('/service-trend', asyncHandler(async (req, res) => {
  const { from, to } = req.query;

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

    const trend = await overviewController.getServiceTrend(fromDate, toDate);

    res.json({
      success: true,
      data: trend.map((row) => ({
        date: row.date,
        totalEvents: row.total_events,
        errorEvents: row.error_events,
        p95LatencyMs: row.p95_latency_ms,
      })),
    });
  } catch (error) {
    throw error;
  }
}));

module.exports = router;
