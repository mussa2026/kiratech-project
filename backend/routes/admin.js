const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { authenticate, requireVerified, authorize } = require('../middleware/auth');
const { User, Technician, ServiceRequest, Service, Notification, Review } = require('../models');
const { paginate, paginateResponse } = require('../utils/helpers');
const { sendTechnicianAssignedEmail, sendTechnicianTaskEmail } = require('../utils/email');

const router = express.Router();
router.use(authenticate, requireVerified, authorize('admin'));

/**
 * @swagger
 * /api/admin/dashboard-stats:
 *   get:
 *     summary: Get system dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats and recent requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:         { type: integer }
 *                     totalTechnicians:   { type: integer }
 *                     totalRequests:      { type: integer }
 *                     pendingRequests:    { type: integer }
 *                     inProgressRequests: { type: integer }
 *                     completedRequests:  { type: integer }
 *                 recentRequests:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ServiceRequest' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/dashboard-stats', async (req, res) => {
  try {
    const [totalUsers, totalTechnicians, totalRequests, pendingRequests, inProgressRequests, completedRequests] = await Promise.all([
      User.count({ where: { role: 'customer', isActive: true } }),
      Technician.count({ where: { isActive: true } }),
      ServiceRequest.count(),
      ServiceRequest.count({ where: { status: 'pending' } }),
      ServiceRequest.count({ where: { status: 'in_progress' } }),
      ServiceRequest.count({ where: { status: 'completed' } }),
    ]);
    const recentRequests = await ServiceRequest.findAll({
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: Service, as: 'service', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']], limit: 5,
    });
    res.json({ stats: { totalUsers, totalTechnicians, totalRequests, pendingRequests, inProgressRequests, completedRequests }, recentRequests });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users with optional filtering
 *     tags: [Admin]
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
 *         name: role
 *         schema: { $ref: '#/components/schemas/UserRole' }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/users', async (req, res) => {
  try {
    const { page, limit, role, search, isActive } = req.query;
    const { limit: lim, offset, page: pg } = paginate(page, limit);
    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }];
    const { count, rows } = await User.findAndCountAll({ where, attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] }, order: [['createdAt', 'DESC']], limit: lim, offset });
    res.json(paginateResponse(rows, pg, lim, count));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User with technician profile if applicable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] }, include: [{ model: Technician, as: 'technicianProfile' }] });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Activate or deactivate a user account
 *     tags: [Admin]
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
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: User status updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       403:
 *         description: Cannot modify admin accounts
 */
router.put('/users/:id/status', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot modify admin accounts' });
    await user.update({ isActive: req.body.isActive });
    res.json({ message: `User ${req.body.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * @swagger
 * /api/admin/technicians:
 *   get:
 *     summary: List all active technicians
 *     tags: [Admin]
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
 *         name: availability
 *         schema: { $ref: '#/components/schemas/Availability' }
 *     responses:
 *       200:
 *         description: Paginated list of technicians
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Technician' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/technicians', async (req, res) => {
  try {
    const { page, limit, availability } = req.query;
    const { limit: lim, offset, page: pg } = paginate(page, limit);
    const where = { isActive: true };
    if (availability) where.availability = availability;
    const { count, rows } = await Technician.findAndCountAll({ where, include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'avatar', 'isActive'] }], order: [['createdAt', 'DESC']], limit: lim, offset });
    res.json(paginateResponse(rows, pg, lim, count));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch technicians' });
  }
});

/**
 * @swagger
 * /api/admin/technicians:
 *   post:
 *     summary: Create a new technician account
 *     description: Creates both the user account and technician profile in a single call. The account is pre-verified.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:           { type: string, example: Alice Technician }
 *               email:          { type: string, format: email, example: alice@kiratech.com }
 *               password:       { type: string, minLength: 8, example: 'TechPass1' }
 *               phone:          { type: string, example: '+255712345678' }
 *               specialization: { type: string, example: Hardware & Networking }
 *               experience:     { type: integer, example: 4 }
 *               skills:         { type: array, items: { type: string }, example: [Windows, Linux, Networking] }
 *     responses:
 *       201:
 *         description: Technician created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:        { $ref: '#/components/schemas/User' }
 *                 techProfile: { $ref: '#/components/schemas/Technician' }
 *                 message:     { type: string }
 *       409:
 *         description: Email already registered
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/technicians',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must be 8+ chars with uppercase, lowercase, and number'),
    body('phone').optional({ values: 'falsy' }).isMobilePhone().withMessage('Valid phone number required'),
    body('specialization').optional({ values: 'falsy' }).trim(),
    body('experience').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Experience must be a number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const existing = await User.findOne({ where: { email: req.body.email } });
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const phone = req.body.phone || null;
      const specialization = req.body.specialization || null;
      const experience = req.body.experience !== '' && req.body.experience != null ? parseInt(req.body.experience, 10) : null;
      const user = await User.create({ name: req.body.name, email: req.body.email, password: req.body.password, phone, role: 'technician', isVerified: true });
      const empId = `KT-TECH-${Date.now().toString().slice(-5)}`;
      const techProfile = await Technician.create({ userId: user.id, employeeId: empId, specialization, skills: req.body.skills || [], experience });
      res.status(201).json({ user: user.toSafeObject(), techProfile, message: 'Technician account created successfully' });
    } catch (err) {
      console.error('Create technician error:', err);
      res.status(500).json({ error: 'Failed to create technician' });
    }
  }
);

/**
 * @swagger
 * /api/admin/technicians/{id}:
 *   delete:
 *     summary: Remove (soft-delete) a technician
 *     description: Sets `isActive=false` on both the technician profile and their user account.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Technician profile ID (not user ID)
 *     responses:
 *       200:
 *         description: Technician removed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/technicians/:id', async (req, res) => {
  try {
    const tech = await Technician.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
    if (!tech) return res.status(404).json({ error: 'Technician not found' });
    await tech.update({ isActive: false });
    await tech.user.update({ isActive: false });
    res.json({ message: 'Technician removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove technician' });
  }
});

/**
 * @swagger
 * /api/admin/requests:
 *   get:
 *     summary: List all service requests in the system
 *     tags: [Admin]
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
 *       - in: query
 *         name: priority
 *         schema: { $ref: '#/components/schemas/RequestPriority' }
 *       - in: query
 *         name: technicianId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated list of all requests
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
router.get('/requests', async (req, res) => {
  try {
    const { page, limit, status, priority, technicianId } = req.query;
    const { limit: lim, offset, page: pg } = paginate(page, limit);
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (technicianId) where.technicianId = technicianId;
    const { count, rows } = await ServiceRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'category'] },
        { model: Technician, as: 'technician', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'] }] },
      ],
      order: [['createdAt', 'DESC']], limit: lim, offset,
    });
    res.json(paginateResponse(rows, pg, lim, count));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

/**
 * @swagger
 * /api/admin/requests/{id}:
 *   get:
 *     summary: Get a single service request by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full request details with customer, service, technician, and review
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request: { $ref: '#/components/schemas/ServiceRequest' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/requests/:id', async (req, res) => {
  try {
    const request = await ServiceRequest.findByPk(req.params.id, {
      include: [
        { model: User, as: 'customer', attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken'] } },
        { model: Service, as: 'service' },
        { model: Technician, as: 'technician', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'email'] }] },
        { model: Review, as: 'review' },
      ],
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ request });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

/**
 * @swagger
 * /api/admin/requests/{id}/assign:
 *   put:
 *     summary: Assign a technician to a service request
 *     description: Can only assign to requests with status `pending` or `rejected`. Notifies both customer and technician via in-app notification and email.
 *     tags: [Admin]
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
 *             required: [technicianId]
 *             properties:
 *               technicianId: { type: string, format: uuid }
 *               adminNotes:   { type: string, example: Priority customer — please attend ASAP }
 *     responses:
 *       200:
 *         description: Technician assigned successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       400:
 *         description: Request is not in a pending state
 *       404:
 *         description: Request or technician not found
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/requests/:id/assign', [body('technicianId').notEmpty().isUUID()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const request = await ServiceRequest.findByPk(req.params.id, { include: [{ model: User, as: 'customer' }, { model: Service, as: 'service' }] });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!['pending', 'rejected'].includes(request.status)) return res.status(400).json({ error: 'Can only assign pending requests' });
    const tech = await Technician.findByPk(req.body.technicianId, { include: [{ model: User, as: 'user' }] });
    if (!tech || !tech.isActive) return res.status(404).json({ error: 'Technician not found' });
    await request.update({ technicianId: req.body.technicianId, status: 'assigned', assignedAt: new Date(), adminNotes: req.body.adminNotes || null });
    await Notification.create({ userId: request.userId, title: 'Technician Assigned', message: `Technician ${tech.user.name} has been assigned to your request #${request.ticketNumber}.`, type: 'request_assigned', relatedId: request.id });
    await Notification.create({ userId: tech.userId, title: 'New Task Assigned', message: `A new service request #${request.ticketNumber} has been assigned to you.`, type: 'request_assigned', relatedId: request.id });
    await sendTechnicianAssignedEmail(request.customer, request, tech.user);
    await sendTechnicianTaskEmail(tech.user, request, request.service, request.customer);
    res.json({ message: 'Technician assigned successfully' });
  } catch (err) {
    console.error('Assign technician error:', err);
    res.status(500).json({ error: 'Failed to assign technician' });
  }
});

/**
 * @swagger
 * /api/admin/requests/{id}/cancel:
 *   put:
 *     summary: Cancel a service request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: Customer requested cancellation }
 *     responses:
 *       200:
 *         description: Request cancelled
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       400:
 *         description: Cannot cancel a completed or already-cancelled request
 */
router.put('/requests/:id/cancel', async (req, res) => {
  try {
    const request = await ServiceRequest.findByPk(req.params.id, { include: [{ model: User, as: 'customer' }] });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (['completed', 'cancelled'].includes(request.status)) return res.status(400).json({ error: 'Cannot cancel this request' });
    await request.update({ status: 'cancelled', cancelledAt: new Date(), cancellationReason: req.body.reason || 'Cancelled by admin' });
    await Notification.create({ userId: request.userId, title: 'Request Cancelled', message: `Your service request #${request.ticketNumber} has been cancelled.`, type: 'request_cancelled', relatedId: request.id });
    res.json({ message: 'Request cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

/**
 * @swagger
 * /api/admin/reports/summary:
 *   get:
 *     summary: Get aggregated system analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 byStatus:
 *                   type: array
 *                   description: Request count grouped by status
 *                   items:
 *                     type: object
 *                     properties:
 *                       status: { type: string }
 *                       count:  { type: integer }
 *                 byService:
 *                   type: array
 *                   description: Top 5 most requested services
 *                   items:
 *                     type: object
 *                     properties:
 *                       count:   { type: integer }
 *                       service: { $ref: '#/components/schemas/Service' }
 *                 byPriority:
 *                   type: array
 *                   description: Request count grouped by priority
 *                   items:
 *                     type: object
 *                     properties:
 *                       priority: { type: string }
 *                       count:    { type: integer }
 *                 topTechs:
 *                   type: array
 *                   description: Top 5 technicians by jobs completed
 *                   items: { $ref: '#/components/schemas/Technician' }
 */
router.get('/reports/summary', async (req, res) => {
  try {
    const { Sequelize } = require('../models');
    const [byStatus, byService, byPriority, topTechs] = await Promise.all([
      ServiceRequest.findAll({ attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']], group: ['status'] }),
      ServiceRequest.findAll({ attributes: [[Sequelize.fn('COUNT', Sequelize.col('ServiceRequest.id')), 'count']], include: [{ model: Service, as: 'service', attributes: ['name'] }], group: ['service.id'], order: [[Sequelize.literal('count'), 'DESC']], limit: 5 }),
      ServiceRequest.findAll({ attributes: ['priority', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']], group: ['priority'] }),
      Technician.findAll({ attributes: ['id', 'rating', 'totalJobsDone'], include: [{ model: User, as: 'user', attributes: ['id', 'name'] }], order: [['totalJobsDone', 'DESC']], limit: 5 }),
    ]);
    res.json({ byStatus, byService, byPriority, topTechs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
