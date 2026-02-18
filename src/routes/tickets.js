const express = require('express');
const router = express.Router();
const { asyncHandler, parseDate, parsePagination } = require('../utils/helpers');
const ticketsController = require('../controllers/ticketsController');

/**
 * GET /api/tickets
 * List all tickets with filters and pagination
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, channel, priority, issueType, from, to, page = 1, pageSize = 25 } = req.query;

  try {
    // Parse pagination
    const pagination = parsePagination(page, pageSize);

    // Validate date parameters if provided but keep raw ISO strings
    let fromDateValid = null;
    let toDateValid = null;

    if (from) {
      fromDateValid = parseDate(from);
    }
    if (to) {
      toDateValid = parseDate(to);
    }

    if (fromDateValid && toDateValid && fromDateValid >= toDateValid) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Parameter "from" must be before "to"',
      });
    }

    // Pass raw ISO strings (controller will parse/format them)
    const filters = {
      status,
      channel,
      priority,
      issueType,
      from: from || null,
      to: to || null,
      ...pagination,
    };

    const result = await ticketsController.listTickets(filters);

    res.json({
      success: true,
      data: result.data.map((ticket) => ({
        ticketId: ticket.ticket_id,
        customerId: ticket.customer_id,
        merchantId: ticket.merchant_id,
        status: ticket.status,
        channel: ticket.channel,
        priority: ticket.priority,
        issueType: ticket.issue_type,
        summary: ticket.summary,
        createdAt: ticket.created_at,
        firstResponseAt: ticket.first_response_at,
        resolvedAt: ticket.resolved_at,
        firstResponseSeconds: ticket.first_response_seconds,
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * GET /api/tickets/:ticketId
 * Get detailed ticket information
 */
router.get('/:ticketId', asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  if (!ticketId) {
    return res.status(400).json({
      success: false,
      error: 'Bad request',
      message: 'Missing ticketId parameter',
    });
  }

  try {
    const ticket = await ticketsController.getTicketDetail(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Ticket with ID ${ticketId} not found`,
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * GET /api/tickets/:ticketId/events
 * Get all events for a ticket
 */
router.get('/:ticketId/events', asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  if (!ticketId) {
    return res.status(400).json({
      success: false,
      error: 'Bad request',
      message: 'Missing ticketId parameter',
    });
  }

  try {
    const events = await ticketsController.getTicketEvents(ticketId);

    res.json({
      success: true,
      data: events.map((event) => ({
        ticketEventId: event.ticket_event_id,
        ticketId: event.ticket_id,
        eventType: event.event_type,
        eventTime: event.event_time,
        actorType: event.actor_type,
        actorAgentId: event.actor_agent_id,
        oldValue: event.old_value,
        newValue: event.new_value,
        payloadJson: event.payload_json,
      })),
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * GET /api/tickets/:ticketId/messages
 * Get all messages for a ticket
 */
router.get('/:ticketId/messages', asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  if (!ticketId) {
    return res.status(400).json({
      success: false,
      error: 'Bad request',
      message: 'Missing ticketId parameter',
    });
  }

  try {
    const messages = await ticketsController.getTicketMessages(ticketId);

    res.json({
      success: true,
      data: messages.map((msg) => ({
        messageId: msg.message_id,
        ticketId: msg.ticket_id,
        messageTime: msg.message_time,
        actorType: msg.actor_type,
        agentId: msg.agent_id,
        channel: msg.channel,
        messageText: msg.message_text,
        messageSummary: msg.message_summary,
        sentiment: msg.sentiment,
      })),
    });
  } catch (error) {
    throw error;
  }
}));

module.exports = router;
