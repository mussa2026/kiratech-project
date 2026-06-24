const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TechnicianMessage = sequelize.define(
    'TechnicianMessage',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      senderId:   { type: DataTypes.UUID, allowNull: false, references: { model: 'technicians', key: 'id' } },
      receiverId: { type: DataTypes.UUID, allowNull: false, references: { model: 'technicians', key: 'id' } },
      message:    { type: DataTypes.TEXT, allowNull: false },
      isRead:     { type: DataTypes.BOOLEAN, defaultValue: false },
      // Optional: link message to a specific service request (task sharing)
      requestId:  { type: DataTypes.UUID, allowNull: true, references: { model: 'service_requests', key: 'id' } },
      ticketNumber: { type: DataTypes.STRING(20), allowNull: true }, // cached for display
    },
    { tableName: 'technician_messages', timestamps: true }
  );
  return TechnicianMessage;
};
