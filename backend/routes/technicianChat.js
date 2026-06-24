const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { authenticate, requireVerified, authorize } = require('../middleware/auth');
const { Technician, TechnicianMessage, User, ServiceRequest, Notification } = require('../models');

const router = express.Router();
router.use(authenticate, requireVerified, authorize('technician', 'admin'));

// Helper: get the Technician record for the current user
async function getMyTech(userId) {
  return Technician.findOne({ where: { userId, isActive: true } });
}

// ── GET /api/technician/chat/technicians ─────────────────────────────────────
// List all other active technicians to start a chat with
router.get('/technicians', async (req, res) => {
  try {
    const me = await getMyTech(req.user.id);
    if (!me) return res.status(404).json({ error: 'Technician profile not found' });

    const technicians = await Technician.findAll({
      where: { isActive: true, id: { [Op.ne]: me.id } },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }],
      order: [['availability', 'ASC'], [{ model: User, as: 'user' }, 'name', 'ASC']],
    });

    // Attach unread count per technician
    const withUnread = await Promise.all(technicians.map(async (t) => {
      const unread = await TechnicianMessage.count({
        where: { senderId: t.id, receiverId: me.id, isRead: false },
      });
      return { ...t.toJSON(), unreadCount: unread };
    }));

    res.json({ technicians: withUnread });
  } catch (err) {
    console.error('Chat technicians error:', err);
    res.status(500).json({ error: 'Failed to fetch technicians' });
  }
});

// ── GET /api/technician/chat/unread-count ────────────────────────────────────
// Total unread message count for badge in nav
router.get('/unread-count', async (req, res) => {
  try {
    const me = await getMyTech(req.user.id);
    if (!me) return res.json({ count: 0 });
    const count = await TechnicianMessage.count({
      where: { receiverId: me.id, isRead: false },
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// ── GET /api/technician/chat/messages/:technicianId ──────────────────────────
// Fetch conversation between current technician and another
router.get('/messages/:technicianId', async (req, res) => {
  try {
    const me = await getMyTech(req.user.id);
    if (!me) return res.status(404).json({ error: 'Technician profile not found' });

    const otherId = req.params.technicianId;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await TechnicianMessage.findAndCountAll({
      where: {
        [Op.or]: [
          { senderId: me.id,    receiverId: otherId },
          { senderId: otherId,  receiverId: me.id },
        ],
      },
      include: [
        { model: Technician, as: 'sender',   include: [{ model: User, as: 'user', attributes: ['id','name','avatar'] }] },
        { model: Technician, as: 'receiver', include: [{ model: User, as: 'user', attributes: ['id','name','avatar'] }] },
      ],
      order: [['createdAt', 'ASC']],
      limit,
      offset,
    });

    // Mark received messages as read
    await TechnicianMessage.update(
      { isRead: true },
      { where: { senderId: otherId, receiverId: me.id, isRead: false } }
    );

    res.json({ messages: rows, total: count, page, myTechnicianId: me.id });
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ── POST /api/technician/chat/messages ──────────────────────────────────────
// Send a message to another technician
router.post('/messages',
  [
    body('receiverId').notEmpty().isUUID().withMessage('Valid receiver technician ID required'),
    body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters'),
    body('requestId').optional().isUUID(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const me = await getMyTech(req.user.id);
      if (!me) return res.status(404).json({ error: 'Technician profile not found' });

      const { receiverId, message, requestId } = req.body;

      // Verify receiver exists
      const receiver = await Technician.findByPk(receiverId, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      });
      if (!receiver) return res.status(404).json({ error: 'Recipient technician not found' });

      // Get ticket number if requestId provided
      let ticketNumber = null;
      if (requestId) {
        const sr = await ServiceRequest.findByPk(requestId, { attributes: ['ticketNumber'] });
        if (sr) ticketNumber = sr.ticketNumber;
      }

      const msg = await TechnicianMessage.create({
        senderId: me.id,
        receiverId,
        message,
        requestId: requestId || null,
        ticketNumber,
      });

      // Notify receiver
      await Notification.create({
        userId: receiver.user.id,
        title: `Message from ${req.user.name}`,
        message: requestId
          ? `${req.user.name} shared task ${ticketNumber} with you: "${message.slice(0, 80)}"`
          : `${req.user.name}: "${message.slice(0, 80)}"`,
        type: 'general',
        relatedId: msg.id,
      });

      // Return message with sender info populated
      const full = await TechnicianMessage.findByPk(msg.id, {
        include: [
          { model: Technician, as: 'sender',   include: [{ model: User, as: 'user', attributes: ['id','name','avatar'] }] },
          { model: Technician, as: 'receiver', include: [{ model: User, as: 'user', attributes: ['id','name','avatar'] }] },
        ],
      });

      res.status(201).json({ message: full });
    } catch (err) {
      console.error('Send message error:', err);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

// ── PUT /api/technician/chat/messages/:technicianId/read ─────────────────────
// Mark all messages from a technician as read
router.put('/messages/:technicianId/read', async (req, res) => {
  try {
    const me = await getMyTech(req.user.id);
    if (!me) return res.status(404).json({ error: 'Technician profile not found' });
    await TechnicianMessage.update(
      { isRead: true },
      { where: { senderId: req.params.technicianId, receiverId: me.id, isRead: false } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ── POST /api/technician/tasks/:id/share ─────────────────────────────────────
// Share/forward a task to another technician (sends a message with task context)
router.post('/tasks/:id/share',
  [
    body('targetTechnicianId').notEmpty().isUUID().withMessage('Target technician ID required'),
    body('message').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const me = await getMyTech(req.user.id);
      if (!me) return res.status(404).json({ error: 'Technician profile not found' });

      const task = await ServiceRequest.findByPk(req.params.id, {
        include: [{ model: require('../models').Service, as: 'service', attributes: ['name'] }],
      });
      if (!task) return res.status(404).json({ error: 'Task not found' });

      const target = await Technician.findByPk(req.body.targetTechnicianId, {
        include: [{ model: User, as: 'user', attributes: ['id','name'] }],
      });
      if (!target) return res.status(404).json({ error: 'Target technician not found' });

      const shareMsg = req.body.message
        ? req.body.message
        : `I'm sharing task ${task.ticketNumber} (${task.service?.name || 'IT Service'}) with you. Can you assist?`;

      const msg = await TechnicianMessage.create({
        senderId: me.id,
        receiverId: target.id,
        message: shareMsg,
        requestId: task.id,
        ticketNumber: task.ticketNumber,
      });

      await Notification.create({
        userId: target.user.id,
        title: `Task Shared by ${req.user.name}`,
        message: `${req.user.name} shared task ${task.ticketNumber} with you: "${shareMsg.slice(0, 80)}"`,
        type: 'request_assigned',
        relatedId: task.id,
      });

      res.status(201).json({ message: 'Task shared successfully', chatMessage: msg });
    } catch (err) {
      console.error('Share task error:', err);
      res.status(500).json({ error: 'Failed to share task' });
    }
  }
);

module.exports = router;
