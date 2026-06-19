const express = require('express');
const { body, validationResult } = require('express-validator');
const { Service } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: List all active services
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           $ref: '#/components/schemas/ServiceCategory'
 *         description: Filter by category (standard or premium)
 *     responses:
 *       200:
 *         description: List of services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;
    const services = await Service.findAll({ where, order: [['sortOrder', 'ASC'], ['name', 'ASC']] });
    res.json({ services });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get a single service by ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Service object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service: { $ref: '#/components/schemas/Service' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ service });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a new service (admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category]
 *             properties:
 *               name:              { type: string, example: Computer Maintenance }
 *               description:       { type: string }
 *               category:          { $ref: '#/components/schemas/ServiceCategory' }
 *               icon:              { type: string, example: computer }
 *               basePrice:         { type: number, example: 50.00 }
 *               estimatedDuration: { type: string, example: 1-3 hours }
 *               sortOrder:         { type: integer, example: 1 }
 *     responses:
 *       201:
 *         description: Service created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service: { $ref: '#/components/schemas/Service' }
 *                 message: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Service name required'),
    body('category').isIn(['standard', 'premium']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const service = await Service.create(req.body);
      res.status(201).json({ service, message: 'Service created' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create service' });
    }
  }
);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Update a service (admin only)
 *     tags: [Services]
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
 *             properties:
 *               name:              { type: string }
 *               description:       { type: string }
 *               category:          { $ref: '#/components/schemas/ServiceCategory' }
 *               basePrice:         { type: number }
 *               estimatedDuration: { type: string }
 *               isActive:          { type: boolean }
 *               sortOrder:         { type: integer }
 *     responses:
 *       200:
 *         description: Service updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service: { $ref: '#/components/schemas/Service' }
 *                 message: { type: string }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    await service.update(req.body);
    res.json({ service, message: 'Service updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Deactivate a service — soft delete (admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Service deactivated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    await service.update({ isActive: false });
    res.json({ message: 'Service deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate service' });
  }
});

module.exports = router;
