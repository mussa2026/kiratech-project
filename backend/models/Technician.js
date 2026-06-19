const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Technician = sequelize.define(
    'Technician',
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
      employeeId: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: true,
      },
      specialization: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      skills: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      experience: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Years of experience',
      },
      availability: {
        type: DataTypes.ENUM('available', 'busy', 'offline'),
        defaultValue: 'available',
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.0,
      },
      totalJobsDone: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'technicians',
      timestamps: true,
    }
  );

  return Technician;
};
