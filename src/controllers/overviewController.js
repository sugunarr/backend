const { query, queryOne } = require('../config/database');

/**
 * GET /api/overview/summary
 * Executive summary with key metrics
 */
async function getSummary(from, to) {
  const sql = `
    SELECT
      COUNT(*) AS total_tickets,

      SUM(t.status = 'CLOSED') AS tickets_closed,

      SUM(
        t.first_response_at IS NOT NULL
        AND t.sla_due_at IS NOT NULL
        AND t.first_response_at > t.sla_due_at
      ) AS sla_breaches,

      ROUND(
        AVG(
          COALESCE(
            TIMESTAMPDIFF(SECOND, t.created_at, t.first_response_at),
            TIMESTAMPDIFF(SECOND, t.created_at, UTC_TIMESTAMP())
          )
        )
      ) AS avg_first_response_seconds

    FROM tickets t
    WHERE t.created_at >= ? AND t.created_at < ?;
  `;

  const errorSql = `
    SELECT COUNT(*) AS total_error_events
    FROM service_log_events
    WHERE level = 'ERROR'
      AND event_time >= ? AND event_time < ?;
  `;

  const summary = await queryOne(sql, [from, to]);
  const errors = await queryOne(errorSql, [from, to]);

  return {
    ...summary,
    total_error_events: errors.total_error_events
  };
}


/**
 * GET /api/overview/support-trend
 * Daily ticket and SLA trends
 */
async function getSupportTrend(from, to) {
  // Expect `from` and `to` already converted to MySQL DATETIME strings
  const sql = `
    SELECT
      DATE(t.created_at) AS date,
      COUNT(*) AS tickets_created,
      SUM(t.status = 'CLOSED') AS tickets_closed,
      SUM(
        t.first_response_at IS NOT NULL
        AND t.sla_due_at IS NOT NULL
        AND t.first_response_at > t.sla_due_at
      ) AS sla_breaches
    FROM tickets t
    WHERE t.created_at >= ? AND t.created_at < ?
    GROUP BY DATE(t.created_at)
    ORDER BY DATE(t.created_at) ASC
  `;

  return query(sql, [from, to]);
}

/**
 * GET /api/overview/service-trend
 * Daily service event and latency trends
 */
async function getServiceTrend(from, to) {
  const sql = `
    SELECT
      DATE(sl.event_time) AS date,
      COUNT(*) AS total_events,
      SUM(CASE WHEN sl.level = 'ERROR' THEN 1 ELSE 0 END) AS error_events,
      ROUND(
        CAST(
          SUBSTRING_INDEX(
            SUBSTRING_INDEX(
              GROUP_CONCAT(sl.latency_ms ORDER BY sl.latency_ms),
              ',',
              ROUND(COUNT(*) * 0.95)
            ),
            ',',
            -1
          ) AS DECIMAL(10,2)
        )
      ) AS p95_latency_ms
    FROM service_log_events sl
    WHERE sl.event_time >= ? AND sl.event_time < ? AND sl.latency_ms IS NOT NULL
    GROUP BY DATE(sl.event_time)
    ORDER BY DATE(sl.event_time) ASC
  `;

  return query(sql, [from, to]);
}

module.exports = {
  getSummary,
  getSupportTrend,
  getServiceTrend,
};
