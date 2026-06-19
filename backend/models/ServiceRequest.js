const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ServiceRequest = sequelize.define(
    'ServiceRequest',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ticketNumber: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
        defaultValue: 'PENDING', // overwritten by beforeValidate hook below
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'services', key: 'id' },
      },
      technicianId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'technicians', key: 'id' },
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'assigned',
          'accepted',
          'in_progress',
          'completed',
          'cancelled',
          'rejected'
        ),
        defaultValue: 'pending',
      },
      preferredDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      preferredTime: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      location: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      attachments: {
        type: DataTypes.TEXT,  // stored as JSON string for MySQL 5.x compatibility
        allowNull: true,
        defaultValue: '[]',
        get() {
          const v = this.getDataValue('attachments');
          try { return v ? JSON.parse(v) : []; } catch { return []; }
        },
        set(v) {
          this.setDataValue('attachments', JSON.stringify(v || []));
        },
      },
      technicianNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estimatedCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      finalCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      paymentStatus: {
        type: DataTypes.ENUM('unpaid', 'paid', 'waived'),
        defaultValue: 'unpaid',
      },
      assignedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancellationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'service_requests',
      timestamps: true,
      hooks: {
        beforeValidate: (request) => {
          if (!request.ticketNumber || request.ticketNumber === 'PENDING') {
            const prefix = 'KT';
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            request.ticketNumber = `${prefix}-${timestamp}-${random}`;
          }
        },
      },
    }
  );

  return ServiceRequest;
};
