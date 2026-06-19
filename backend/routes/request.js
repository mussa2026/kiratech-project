const express = require('express');
const { authenticate, requireVerified } = require('../middleware/auth');
const { ServiceRequest, Service, User, Technician, Review } = require('../models');

const router = express.Router();
router.use(authenticate, requireVerified);

/**
 * @swagger
 * /api/requests/ticket/{ticketNumber}:
 *   get:
 *     summary: Look up a service request by ticket number
 *     description: |
 *       Accessible by the owning customer, their assigned technician, or any admin.
 *       Ticket numbers follow the format **KT-xxxxxx-xxx**.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketNumber
 *         required: true
 *         schema: { type: string }
 *         example: KT-123456-001
 *     responses:
 *       200:
 *         description: Service request found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request: { $ref: '#/components/schemas/ServiceRequest' }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/ticket/:ticketNumber', async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({
      where: { ticketNumber: req.params.ticketNumber },
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name', 'category'] },
        { model: Technician, as: 'technician', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'avatar'] }] },
      ],
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    const isCustomer   = request.userId === req.user.id;
    const isAdmin      = req.user.role === 'admin';
    const isTechnician = request.technician && request.technician.userId === req.user.id;
    if (!isCustomer && !isAdmin && !isTechnician) return res.status(403).json({ error: 'Access denied' });
    res.json({ request });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

module.exports = router;
