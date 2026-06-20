const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireVerified } = require('../middleware/auth');
const { User, ServiceRequest, Service, Technician, Notification, Review } = require('../models');
const { paginate, paginateResponse } = require('../utils/helpers');

const router = express.Router();
router.use(authenticate, requireVerified);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get the current customer's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/profile', (req, res) => {
  res.json({ user: req.user });
});

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update the current customer's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:    { type: string, minLength: 2, maxLength: 100 }
 *               phone:   { type: string, example: '+255714759884' }
 *               address: { type: string }
 *               avatar:  { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:    { $ref: '#/components/schemas/User' }
 *                 message: { type: string }
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('phone').optional().isMobilePhone(),
    body('address').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const allowed = ['name', 'phone', 'address', 'avatar'];
      const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
      await req.user.update(updates);
      res.json({ user: req.user.toSafeObject(), message: 'Profile updated' });
    } catch (err) {
      res.status(500).json({ error: 'Profile update failed' });
    }
  }
);

/**
 * @swagger
 * /api/user/change-password:
 *   put:
 *     summary: Change the current user's password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string, minLength: 8, example: 'NewPass1' }
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       400:
 *         description: Current password is incorrect
 */
router.put(
  '/change-password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const user = await User.findByPk(req.user.id);
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });
      await user.update({ password: req.body.newPassword });
      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Password change failed' });
    }
  }
);

/**
 * @swagger
 * /api/user/requests:
 *   get:
 *     summary: List all service requests for the current customer
 *     tags: [User]
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
 *         description: Paginated list of requests
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
    const { page, limit, status } = req.query;
    const { limit: lim, offset, page: pg } = paginate(page, limit);
    const where = { userId: req.user.id };
    if (status) where.status = status;
    const { count, rows } = await ServiceRequest.findAndCountAll({
      where,
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name', 'category', 'icon'] },
        {
          model: Technician, as: 'technician', attributes: ['id', 'specialization'],
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'avatar'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: lim, offset,
    });
    res.json(paginateResponse(rows, pg, lim, count));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

/**
 * @swagger
 * /api/user/requests/{id}:
 *   get:
 *     summary: Get a single service request by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Service request details
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
    const request = await ServiceRequest.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Service, as: 'service' },
        { model: Technician, as: 'technician', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'email', 'avatar'] }] },
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
 * /api/user/requests:
 *   post:
 *     summary: Submit a new service request
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceId, title, description]
 *             properties:
 *               serviceId:     { type: string, format: uuid }
 *               title:         { type: string, minLength: 5, maxLength: 200, example: Laptop not booting }
 *               description:   { type: string, minLength: 10, example: My laptop shows a black screen on startup }
 *               priority:      { $ref: '#/components/schemas/RequestPriority' }
 *               location:      { type: string, example: Njiro Road, Arusha }
 *               preferredDate: { type: string, format: date, example: '2026-07-01' }
 *               preferredTime: { type: string, example: '10:00' }
 *     responses:
 *       201:
 *         description: Request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request: { $ref: '#/components/schemas/ServiceRequest' }
 *                 message: { type: string }
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Service not found or inactive
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/requests',
  [
    body('serviceId').notEmpty().isUUID(),
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 chars'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 chars'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('location').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const { serviceId, title, description, priority, location, preferredDate, preferredTime } = req.body;
      const service = await Service.findByPk(serviceId);
      if (!service || !service.isActive) return res.status(404).json({ error: 'Service not found or inactive' });
      const request = await ServiceRequest.create({
        userId: req.user.id, serviceId, title, description,
        priority: priority || 'medium', location, preferredDate, preferredTime, status: 'pending',
      });
      const { User: UserModel } = require('../models');
      const admins = await UserModel.findAll({ where: { role: 'admin', isActive: true } });
      await Promise.all([
        ...admins.map((admin) =>
          Notification.create({ userId: admin.id, title: 'New Service Request', message: `New request #${request.ticketNumber} from ${req.user.name}: ${title}`, type: 'request_submitted', relatedId: request.id })
        ),
        Notification.create({ userId: req.user.id, title: 'Request Submitted', message: `Your service request #${request.ticketNumber} has been submitted successfully.`, type: 'request_submitted', relatedId: request.id }),
      ]);
      const { sendRequestConfirmation, sendAdminNewRequestEmail } = require('../utils/email');
      await sendRequestConfirmation(req.user, request, service);
      for (const admin of admins) await sendAdminNewRequestEmail(admin.email, request, req.user, service);
      res.status(201).json({ request, message: 'Service request submitted successfully' });
    } catch (err) {
      console.error('Submit request error:', err);
      res.status(500).json({ error: 'Failed to submit request' });
    }
  }
);

/**
 * @swagger
 * /api/user/requests/{id}/review:
 *   post:
 *     summary: Submit a review for a completed service request
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the completed service request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:  { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               comment: { type: string, example: Excellent service, very professional! }
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 review:  { $ref: '#/components/schemas/Review' }
 *                 message: { type: string }
 *       400:
 *         description: Review already submitted
 *       404:
 *         description: Completed request not found
 */
router.post(
  '/requests/:id/review',
  [body('rating').isInt({ min: 1, max: 5 }), body('comment').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const request = await ServiceRequest.findOne({ where: { id: req.params.id, userId: req.user.id, status: 'completed' } });
      if (!request) return res.status(404).json({ error: 'Completed request not found' });
      const existing = await Review.findOne({ where: { requestId: request.id } });
      if (existing) return res.status(400).json({ error: 'Review already submitted' });
      const review = await Review.create({ requestId: request.id, userId: req.user.id, technicianId: request.technicianId, rating: req.body.rating, comment: req.body.comment });
      if (request.technicianId) {
        const { Review: ReviewModel, Technician: TechModel, Sequelize } = require('../models');
        const avg = await ReviewModel.findOne({ where: { technicianId: request.technicianId }, attributes: [[Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating']] });
        await TechModel.update({ rating: parseFloat(avg.dataValues.avgRating).toFixed(2) }, { where: { id: request.technicianId } });
      }
      res.status(201).json({ review, message: 'Review submitted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit review' });
    }
  }
);

/**
 * @swagger
 * /api/user/notifications:
 *   get:
 *     summary: Get notifications for the current user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Notification' }
 *                 unreadCount: { type: integer }
 */
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']], limit: 50 });
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * @swagger
 * /api/user/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 */
router.put('/notifications/read-all', async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
});

module.exports = router;
