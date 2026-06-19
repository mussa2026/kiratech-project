const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireVerified, authorize } = require('../middleware/auth');
const { ServiceRequest, Service, User, Technician, Notification } = require('../models');
const { paginate, paginateResponse } = require('../utils/helpers');
const { sendStatusUpdateEmail } = require('../utils/email');

const router = express.Router();
router.use(authenticate, requireVerified, authorize('technician', 'admin'));

/**
 * @swagger
 * /api/technician/profile:
 *   get:
 *     summary: Get the technician's own profile
 *     tags: [Technician]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Technician profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile: { $ref: '#/components/schemas/Technician' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/profile', async (req, res) => {
  try {
    const profile = await Technician.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'user', attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] } }],
    });
    if (!profile) return res.status(404).json({ error: 'Technician profile not found' });
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * @swagger
 * /api/technician/profile:
 *   put:
 *     summary: Update the technician's own profile
 *     tags: [Technician]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialization: { type: string, example: Networking & WiFi }
 *               skills:         { type: array, items: { type: string } }
 *               bio:            { type: string }
 *               experience:     { type: integer, example: 5 }
 *               availability:   { $ref: '#/components/schemas/Availability' }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile: { $ref: '#/components/schemas/Technician' }
 *                 message: { type: string }
 */
router.put('/profile', async (req, res) => {
  try {
    const profile = await Technician.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const allowed = ['specialization', 'skills', 'bio', 'experience', 'availability'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    await profile.update(updates);
    res.json({ profile, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * @swagger
 * /api/technician/dashboard-stats:
 *   get:
 *     summary: Get dashboard statistics for the technician
 *     tags: [Technician]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task counts and rating
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:      { type: integer }
 *                     pending:    { type: integer }
 *                     inProgress: { type: integer }
 *                     completed:  { type: integer }
 *                     rating:     { type: number }
 */
router.get('/dashboard-stats', async (req, res) => {
  try {
    const tech = await Technician.findOne({ where: { userId: req.user.id } });
    if (!tech) return res.status(404).json({ error: 'Profile not found' });
    const [total, pending, inProgress, completed] = await Promise.all([
      ServiceRequest.count({ where: { technicianId: tech.id } }),
      ServiceRequest.count({ where: { technicianId: tech.id, status: 'assigned' } }),
      ServiceRequest.count({ where: { technicianId: tech.id, status: 'in_progress' } }),
      ServiceRequest.count({ where: { technicianId: tech.id, status: 'completed' } }),
    ]);
    res.json({ stats: { total, pending, inProgress, completed, rating: tech.rating } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * @swagger
 * /api/technician/tasks:
 *   get:
 *     summary: List tasks assigned to the technician
 *     tags: [Technician]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { $ref: '#/components/schemas/RequestStatus' }
 *     responses:
 *       200:
 *         description: Paginated list of assigned tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ServiceRequest' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/tasks', async (req, res) => {
  try {
    const tech = await Technician.findOne({ where: { userId: req.user.id } });
    if (!tech) return res.status(404).json({ error: 'Technician profile not found' });
    const { page, limit, status } = req.query;
    const { limit: lim, offset, page: pg } = paginate(page, limit);
    const where = { technicianId: tech.id };
    if (status) where.status = status;
    const { count, rows } = await ServiceRequest.findAndCountAll({
      where,
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name', 'category', 'icon'] },
        { model: User, as: 'customer', attributes: ['id', 'name', 'phone', 'email', 'avatar'] },
      ],
      order: [['createdAt', 'DESC']], limit: lim, offset,
    });
    res.json(paginateResponse(rows, pg, lim, count));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * @swagger
 * /api/technician/tasks/{id}:
 *   get:
 *     summary: Get a single assigned task by ID
 *     tags: [Technician]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task with customer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request: { $ref: '#/components/schemas/ServiceRequest' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/tasks/:id', async (req, res) => {
  try {
    const tech = await Technician.findOne({ where: { userId: req.user.id } });
    if (!tech) return res.status(404).json({ error: 'Technician profile not found' });
    const request = await ServiceRequest.findOne({
      where: { id: req.params.id, technicianId: tech.id },
      include: [
        { model: Service, as: 'service' },
        { model: User, as: 'customer', attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] } },
      ],
    });
    if (!request) return res.status(404).json({ error: 'Task not found' });
    res.json({ request });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * @swagger
 * /api/technician/tasks/{id}/accept:
 *   put:
 *     summary: Accept an assigned task
 *     description: Transitions status from `assigned` → `accepted`. Sets technician availability to `busy`.
 *     tags: [Technician]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task accepted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       404:
 *         description: Task not found or already processed
 */
router.put('/tasks/:id/accept', async (req, res) => {
  try {
    const tech = await Technician.findOne({ where: { userId: req.user.id } });
    const request = await ServiceRequest.findOne({ where: { id: req.params.id, technicianId: tech.id, status: 'assigned' }, include: [{ model: User, as: 'customer' }] });
    if (!request) return res.status(404).json({ error: 'Task not found or already processed' });
    await request.update({ status: 'accepted' });
    await tech.update({ availability: 'busy' });
    await Notification.create({ userId: request.userId, title: 'Technician Accepted Your Request', message: `Your service request #${request.ticketNumber} has been accepted. The technician will contact you shortly.`, type: 'request_accepted', relatedId: request.id });
    await sendStatusUpdateEmail(request.customer, request);
    res.json({ message: 'Task accepted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept task' });
  }
});

/**
 * @swagger
 * /api/technician/tasks/{id}/reject:
 *   put:
 *     summary: Reject an assigned task
 *     description: Returns the task to `pending` status. Admin will reassign it.
 *     tags: [Technician]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task rejected
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       404:
 *         description: Task not found or already processed
 */
router.put('/tasks/:id/reject', async (req, res) => {
  try {
    const tech = await Technician.findOne({ where: { userId: req.user.id } });
    const request = await ServiceRequest.findOne({ where: { id: req.params.id, technicianId: tech.id, status: 'assigned' } });
    if (!request) return res.status(404).json({ error: 'Task not found or already processed' });
    await request.update({ status: 'pending', technicianId: null, assignedAt: null });
    res.json({ message: 'Task rejected. Admin will reassign it.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject task' });
  }
});

/**
 * @swagger
 * /api/technician/tasks/{id}/status:
 *   put:
 *     summary: Update task progress status
 *     description: |
 *       Valid transitions:
 *       - `accepted` → `in_progress`
 *       - `in_progress` → `completed`
 *     tags: [Technician]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [in_progress, completed] }
 *               notes:  { type: string, example: Replaced faulty RAM module. System now boots correctly. }
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       400:
 *         description: Invalid status transition
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/tasks/:id/status',
  [body('status').isIn(['in_progress', 'completed']), body('notes').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const tech = await Technician.findOne({ where: { userId: req.user.id } });
      const request = await ServiceRequest.findOne({ where: { id: req.params.id, technicianId: tech.id }, include: [{ model: User, as: 'customer' }] });
      if (!request) return res.status(404).json({ error: 'Task not found' });
      const validTransitions = { accepted: ['in_progress'], in_progress: ['completed'] };
      if (!validTransitions[request.status]?.includes(req.body.status)) {
        return res.status(400).json({ error: `Cannot transition from ${request.status} to ${req.body.status}` });
      }
      const updates = { status: req.body.status };
      if (req.body.notes) updates.technicianNotes = req.body.notes;
      if (req.body.status === 'in_progress') updates.startedAt = new Date();
      if (req.body.status === 'completed') {
        updates.completedAt = new Date();
        await tech.update({ availability: 'available', totalJobsDone: tech.totalJobsDone + 1 });
      }
      await request.update(updates);
      await Notification.create({ userId: request.userId, title: `Request ${req.body.status === 'in_progress' ? 'In Progress' : 'Completed'}`, message: `Your service request #${request.ticketNumber} is now ${req.body.status.replace('_', ' ')}.`, type: `request_${req.body.status}`, relatedId: request.id });
      await sendStatusUpdateEmail(request.customer, request);
      res.json({ message: `Status updated to ${req.body.status}` });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
);

module.exports = router;
