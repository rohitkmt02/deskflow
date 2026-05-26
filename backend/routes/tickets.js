const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { Ticket, PRIORITIES, STATUSES, SLA_TARGETS_MINUTES } = require('../models/Ticket');

const router = express.Router();

const FORWARD_TRANSITIONS = { open: 'in_progress', in_progress: 'resolved', resolved: 'closed' };
const BACKWARD_TRANSITIONS = { in_progress: 'open', resolved: 'in_progress', closed: 'resolved' };

function getAllowedTransitions(current) {
  const allowed = [];
  if (FORWARD_TRANSITIONS[current]) allowed.push(FORWARD_TRANSITIONS[current]);
  if (BACKWARD_TRANSITIONS[current]) allowed.push(BACKWARD_TRANSITIONS[current]);
  return allowed;
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map((e) => ({ field: e.path, message: e.msg })) });
  }
  return null;
}

const createValidation = [
  body('subject').notEmpty().withMessage('Subject is required').trim(),
  body('description').notEmpty().withMessage('Description is required').trim(),
  body('customerEmail').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('priority').isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
];

// POST /tickets
router.post('/', createValidation, async (req, res) => {
  const err = handleValidation(req, res);
  if (err) return;
  try {
    const ticket = await Ticket.create({
      subject: req.body.subject,
      description: req.body.description,
      customerEmail: req.body.customerEmail,
      priority: req.body.priority,
    });
    res.status(201).json(ticket.toJSON());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /tickets/stats (must be before /:id)
router.get('/stats', async (req, res) => {
  try {
    const tickets = await Ticket.find();
    const byStatus = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    let breachedOpen = 0;

    tickets.forEach((t) => {
      byStatus[t.status]++;
      byPriority[t.priority]++;
      const target = SLA_TARGETS_MINUTES[t.priority];
      const age = Math.floor(((t.resolvedAt || new Date()) - t.createdAt) / 60000);
      if ((t.status === 'open' || t.status === 'in_progress') && age > target) {
        breachedOpen++;
      }
    });

    res.json({ byStatus, byPriority, breachedOpen });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /tickets
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      if (!STATUSES.includes(req.query.status))
        return res.status(400).json({ error: `Invalid status. Must be one of: ${STATUSES.join(', ')}` });
      filter.status = req.query.status;
    }
    if (req.query.priority) {
      if (!PRIORITIES.includes(req.query.priority))
        return res.status(400).json({ error: `Invalid priority. Must be one of: ${PRIORITIES.join(', ')}` });
      filter.priority = req.query.priority;
    }

    let tickets = await Ticket.find(filter).sort({ createdAt: -1 });

    if (req.query.breached === 'true') {
      tickets = tickets.filter((t) => t.slaBreached);
    }

    res.json(tickets.map((t) => t.toJSON()));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /tickets/:id
router.patch(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid ticket ID'),
    body('subject').optional().notEmpty().withMessage('Subject cannot be empty').trim(),
    body('description').optional().notEmpty().withMessage('Description cannot be empty').trim(),
    body('customerEmail').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
    body('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  ],
  async (req, res) => {
    const err = handleValidation(req, res);
    if (err) return;
    try {
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

      if (req.body.status) {
        const newStatus = req.body.status;
        if (newStatus !== ticket.status) {
          const allowed = getAllowedTransitions(ticket.status);
          if (!allowed.includes(newStatus)) {
            return res.status(400).json({
              error: `Invalid transition: ${ticket.status} → ${newStatus}. Allowed: ${allowed.join(', ')}`,
            });
          }

          if (newStatus === 'resolved') {
            ticket.resolvedAt = new Date();
          }
          if (ticket.status === 'resolved' && newStatus === 'in_progress') {
            ticket.resolvedAt = null;
          }
          ticket.status = newStatus;
        }
      }

      ['subject', 'description', 'customerEmail', 'priority'].forEach((field) => {
        if (req.body[field] !== undefined) ticket[field] = req.body[field];
      });

      await ticket.save();
      res.json(ticket.toJSON());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// DELETE /tickets/:id
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid ticket ID')],
  async (req, res) => {
    const err = handleValidation(req, res);
    if (err) return;
    try {
      const ticket = await Ticket.findByIdAndDelete(req.params.id);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
      res.json({ message: 'Ticket deleted' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;
