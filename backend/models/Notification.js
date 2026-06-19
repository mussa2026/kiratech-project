const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          'request_submitted',
          'request_assigned',
          'request_accepted',
          'request_in_progress',
          'request_completed',
          'request_cancelled',
          'new_registration',
          'general'
        ),
        defaultValue: 'general',
      },
      relatedId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of related resource (e.g. ServiceRequest ID)',
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'notifications',
      timestamps: true,
    }
  );

  return Notification;
};
