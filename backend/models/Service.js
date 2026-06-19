const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Service = sequelize.define(
    'Service',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM('standard', 'premium'),
        defaultValue: 'standard',
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      basePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      estimatedDuration: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g. 1-2 hours, 1 day',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'services',
      timestamps: true,
    }
  );

  return Service;
};
