const { query, queryOne } = require('../config/database');

/**
 * GET /api/logs/errors/top
 * Get top error signatures with counts
 */
async function getTopErrors(from, to, service = null) {
  const conditions = ['level = ? AND event_time >= ? AND event_time < ?'];
  const params = ['ERROR', from, to];

  if (service) {
    conditions.push('service_name = ?');
    params.push(service);
  }

  const whereClause = conditions.join(' AND ');

  const sql = `
    SELECT
      error_signature,
      service_name,
      COUNT(*) AS error_count,
      MAX(event_time) AS last_occurrence,
      COUNT(DISTINCT DATE(event_time)) AS days_with_errors
    FROM service_log_events
    WHERE ${whereClause}
    GROUP BY error_signature, service_name
    ORDER BY error_count DESC
    LIMIT 20
  `;

  return query(sql, params);
}

/**
 * GET /api/logs/latency/trend
 * Get p95 latency trend over time for a specific service/endpoint
 */
async function getLatencyTrend(from, to, service = null, endpoint = null) {
  const conditions = ['event_time >= ? AND event_time < ? AND latency_ms IS NOT NULL'];
  const params = [from, to];

  if (service) {
    conditions.push('service_name = ?');
    params.push(service);
  }
  if (endpoint) {
    conditions.push('endpoint = ?');
    params.push(endpoint);
  }

  const whereClause = 'WHERE ' + conditions.join(' AND ');

  const sql = `
    SELECT
      DATE_FORMAT(event_time, '%Y-%m-%d %H:00:00') AS hour_start,
      service_name,
      endpoint,
      ROUND(
        CAST(
          SUBSTRING_INDEX(
            SUBSTRING_INDEX(
              GROUP_CONCAT(latency_ms ORDER BY latency_ms),
              ',',
              ROUND(COUNT(*) * 0.95)
            ),
            ',',
            -1
          ) AS DECIMAL(10,2)
        )
      ) AS p95_latency_ms,
      ROUND(AVG(latency_ms), 2) AS avg_latency_ms,
      MAX(latency_ms) AS max_latency_ms,
      COUNT(*) AS request_count
    FROM service_log_events
    ${whereClause}
    GROUP BY DATE_FORMAT(event_time, '%Y-%m-%d %H:00:00'), service_name, endpoint
    ORDER BY hour_start ASC, service_name, endpoint
  `;

  return query(sql, params);
}

module.exports = {
  getTopErrors,
  getLatencyTrend,
};
