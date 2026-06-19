const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'KIRATECH IT Support API',
      version: '1.0.0',
      description: `
## KIRATECH Online Computing & IT Support Management System

This is the complete REST API for the KIRATECH platform.

### Authentication
All protected endpoints require a **Bearer JWT token** in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`

Obtain a token via **POST /api/auth/login**.

### Roles
| Role | Access |
|------|--------|
| \`customer\` | Submit and track service requests |
| \`technician\` | View and manage assigned tasks |
| \`admin\` | Full system management |

### Rate Limits
- General API: **100 requests / 15 minutes**
- Auth endpoints: **20 requests / 15 minutes**
      `,
      contact: {
        name: 'KIRATECH Support',
        email: 'robertcharles088@gmail.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from POST /api/auth/login',
        },
      },
      schemas: {
        // ── Enums ──────────────────────────────────────────────────
        UserRole: {
          type: 'string',
          enum: ['customer', 'technician', 'admin'],
        },
        SubscriptionType: {
          type: 'string',
          enum: ['standard', 'premium'],
        },
        ServiceCategory: {
          type: 'string',
          enum: ['standard', 'premium'],
        },
        RequestStatus: {
          type: 'string',
          enum: ['pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'],
        },
        RequestPriority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
        },
        PaymentStatus: {
          type: 'string',
          enum: ['unpaid', 'paid', 'waived'],
        },
        Availability: {
          type: 'string',
          enum: ['available', 'busy', 'offline'],
        },
        NotificationType: {
          type: 'string',
          enum: ['request_submitted', 'request_assigned', 'request_accepted', 'request_in_progress', 'request_completed', 'request_cancelled', 'new_registration', 'general'],
        },

        // ── Core objects ───────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id:               { type: 'string', format: 'uuid' },
            name:             { type: 'string', example: 'John Doe' },
            email:            { type: 'string', format: 'email' },
            phone:            { type: 'string', example: '+255714759884', nullable: true },
            address:          { type: 'string', nullable: true },
            avatar:           { type: 'string', nullable: true },
            role:             { $ref: '#/components/schemas/UserRole' },
            isVerified:       { type: 'boolean' },
            isActive:         { type: 'boolean' },
            subscriptionType: { $ref: '#/components/schemas/SubscriptionType' },
            lastLogin:        { type: 'string', format: 'date-time', nullable: true },
            createdAt:        { type: 'string', format: 'date-time' },
            updatedAt:        { type: 'string', format: 'date-time' },
          },
        },

        Technician: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' },
            userId:         { type: 'string', format: 'uuid' },
            employeeId:     { type: 'string', example: 'KT-TECH-12345' },
            specialization: { type: 'string', example: 'Networking & Hardware', nullable: true },
            skills:         { type: 'array', items: { type: 'string' } },
            bio:            { type: 'string', nullable: true },
            experience:     { type: 'integer', example: 3, nullable: true },
            availability:   { $ref: '#/components/schemas/Availability' },
            rating:         { type: 'number', format: 'float', example: 4.5 },
            totalJobsDone:  { type: 'integer', example: 42 },
            isActive:       { type: 'boolean' },
            user:           { $ref: '#/components/schemas/User' },
          },
        },

        Service: {
          type: 'object',
          properties: {
            id:                { type: 'string', format: 'uuid' },
            name:              { type: 'string', example: 'Computer Maintenance & Troubleshooting' },
            description:       { type: 'string', nullable: true },
            category:          { $ref: '#/components/schemas/ServiceCategory' },
            icon:              { type: 'string', example: 'computer', nullable: true },
            basePrice:         { type: 'number', format: 'float', example: 50.00, nullable: true },
            estimatedDuration: { type: 'string', example: '1-3 hours', nullable: true },
            isActive:          { type: 'boolean' },
            sortOrder:         { type: 'integer' },
            createdAt:         { type: 'string', format: 'date-time' },
          },
        },

        ServiceRequest: {
          type: 'object',
          properties: {
            id:                 { type: 'string', format: 'uuid' },
            ticketNumber:       { type: 'string', example: 'KT-123456-001' },
            userId:             { type: 'string', format: 'uuid' },
            serviceId:          { type: 'string', format: 'uuid' },
            technicianId:       { type: 'string', format: 'uuid', nullable: true },
            title:              { type: 'string', example: 'Laptop not booting' },
            description:        { type: 'string' },
            priority:           { $ref: '#/components/schemas/RequestPriority' },
            status:             { $ref: '#/components/schemas/RequestStatus' },
            preferredDate:      { type: 'string', format: 'date-time', nullable: true },
            preferredTime:      { type: 'string', example: '14:00', nullable: true },
            location:           { type: 'string', nullable: true },
            technicianNotes:    { type: 'string', nullable: true },
            adminNotes:         { type: 'string', nullable: true },
            estimatedCost:      { type: 'number', nullable: true },
            finalCost:          { type: 'number', nullable: true },
            paymentStatus:      { $ref: '#/components/schemas/PaymentStatus' },
            assignedAt:         { type: 'string', format: 'date-time', nullable: true },
            startedAt:          { type: 'string', format: 'date-time', nullable: true },
            completedAt:        { type: 'string', format: 'date-time', nullable: true },
            cancelledAt:        { type: 'string', format: 'date-time', nullable: true },
            cancellationReason: { type: 'string', nullable: true },
            createdAt:          { type: 'string', format: 'date-time' },
            service:            { $ref: '#/components/schemas/Service' },
            customer:           { $ref: '#/components/schemas/User' },
            technician:         { $ref: '#/components/schemas/Technician', nullable: true },
          },
        },

        Notification: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            userId:    { type: 'string', format: 'uuid' },
            title:     { type: 'string' },
            message:   { type: 'string' },
            type:      { $ref: '#/components/schemas/NotificationType' },
            relatedId: { type: 'string', format: 'uuid', nullable: true },
            isRead:    { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        Review: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            requestId:   { type: 'string', format: 'uuid' },
            userId:      { type: 'string', format: 'uuid' },
            technicianId:{ type: 'string', format: 'uuid' },
            rating:      { type: 'integer', minimum: 1, maximum: 5 },
            comment:     { type: 'string', nullable: true },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },

        Pagination: {
          type: 'object',
          properties: {
            total:      { type: 'integer' },
            page:       { type: 'integer' },
            limit:      { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },

        // ── Common responses ───────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Something went wrong' },
          },
        },

        ValidationError: {
          type: 'object',
          properties: {
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type:     { type: 'string' },
                  msg:      { type: 'string' },
                  path:     { type: 'string' },
                  location: { type: 'string' },
                },
              },
            },
          },
        },

        MessageResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },

      responses: {
        Unauthorized: {
          description: 'Authentication token missing or invalid',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } },
        },
        ServerError: {
          description: 'Internal server error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },

    tags: [
      { name: 'Health',        description: 'API status check' },
      { name: 'Auth',          description: 'Authentication — register, login, verify, password reset' },
      { name: 'User',          description: 'Customer profile and service request management' },
      { name: 'Services',      description: 'IT service catalogue (public read, admin write)' },
      { name: 'Technician',    description: 'Technician task management' },
      { name: 'Admin',         description: 'Full administrative control' },
      { name: 'Notifications', description: 'In-app notification management' },
    ],
  },

  // Route files to scan for JSDoc @swagger annotations
  apis: [
    './routes/*.js',
    './server.js',
  ],
};

module.exports = swaggerJsdoc(options);
