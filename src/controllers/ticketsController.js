const { query, queryOne } = require('../config/database');

/**
 * Helpers
 */
function toMySQLDate(input) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function normUpper(value) {
  return value ? String(value).trim().toUpperCase() : null;
}

/**
 * GET /api/tickets
 * List tickets with filters + pagination
 */
async function listTickets(filters = {}) {
  const {
    status,
    channel,
    priority,
    issueType,
    from,
    to,
    page = 1,
    pageSize = 25,
  } = filters;

  const conditions = [];
  const params = [];

  // Normalize filters
  const s = normUpper(status);
  const ch = normUpper(channel);
  const pr = normUpper(priority);
  const it = issueType ? String(issueType).trim() : null;

  if (s) {
    conditions.push('t.status = ?');
    params.push(s);
  }
  if (ch) {
    conditions.push('t.channel = ?');
    params.push(ch);
  }
  if (pr) {
    conditions.push('t.priority = ?');
    params.push(pr);
  }
  if (it) {
    conditions.push('t.issue_type = ?');
    params.push(it);
  }

  // Date range
  let fromSql = toMySQLDate(from);
  let toSql = toMySQLDate(to);

  // Default to last 30 days
  if (!fromSql && !toSql) {
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    fromSql = toMySQLDate(start);
    toSql = toMySQLDate(now);
  }

  if (fromSql) {
    conditions.push('t.created_at >= ?');
    params.push(fromSql);
  }
  if (toSql) {
    conditions.push('t.created_at < ?');
    params.push(toSql);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // Pagination (INLINE — NOT PARAMS)
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || 25));
  const offset = (pageNum - 1) * size;

  /**
   * COUNT QUERY
   */
  const countSql = `
    SELECT COUNT(*) AS total
    FROM tickets t
    ${whereClause}
  `;

  /**
   * DATA QUERY
   * 🚨 LIMIT / OFFSET MUST BE LITERALS
   */
  const dataSql = `
    SELECT
      t.ticket_id,
      t.customer_id,
      t.merchant_id,
      t.status,
      t.channel,
      t.priority,
      t.issue_type,
      t.summary,
      t.created_at,
      t.first_response_at,
      t.resolved_at,
      TIMESTAMPDIFF(
        SECOND,
        t.created_at,
        COALESCE(t.first_response_at, UTC_TIMESTAMP())
      ) AS first_response_seconds
    FROM tickets t
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT ${size} OFFSET ${offset}
  `;

  console.log('[listTickets] COUNT SQL:', countSql.trim());
  console.log('[listTickets] DATA SQL:', dataSql.trim());
  console.log('[listTickets] PARAMS:', params);

  const countRow = await queryOne(countSql, params);
  const total = Number(countRow?.total || 0);

  const rows = await query(dataSql, params);

  return {
    data: rows || [],
    pagination: {
      page: pageNum,
      pageSize: size,
      total,
      totalPages: Math.ceil(total / size),
    },
  };
}



/**
 * GET /api/tickets/:ticketId
 * Get detailed ticket information using v_ticket_detail view
 */
async function getTicketDetail(ticketId) {
  const sql = `
    SELECT *
    FROM tickets
    WHERE ticket_id = ?
  `;

  return queryOne(sql, [ticketId]);
}

/**
 * GET /api/tickets/:ticketId/events
 * Get all events for a specific ticket
 */
async function getTicketEvents(ticketId) {
  const sql = `
    SELECT
      ticket_event_id,
      ticket_id,
      event_type,
      event_time,
      actor_type,
      actor_agent_id,
      old_value,
      new_value,
      payload_json
    FROM ticket_events
      WHERE ticket_id = ?
    ORDER BY event_time DESC
  `;
    return query(sql, [ticketId]);
}

/**
 * GET /api/tickets/:ticketId/messages
 * Get all messages for a specific ticket
 */
async function getTicketMessages(ticketId) {
  const sql = `
    SELECT
      message_id,
      ticket_id,
      message_time,
      actor_type,
      agent_id,
      channel,
      message_text,
      message_summary,
      sentiment
    FROM ticket_messages
      WHERE ticket_id = ?
    ORDER BY message_time DESC
  `;
    return query(sql, [ticketId]);
}

module.exports = {
  listTickets,
  getTicketDetail,
  getTicketEvents,
  getTicketMessages,
};
