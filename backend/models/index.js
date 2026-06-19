const { Sequelize } = require('sequelize');

const isProd = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: isProd ? false : console.log,
    pool: {
      max: isProd ? 5 : 10,   // fewer connections on free tier
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    // Enable SSL for production databases (PlanetScale, Aiven, etc.)
    // Disable SSL if DB_SSL=false is set (for freesqldatabase.com and similar)
    ...(isProd && process.env.DB_SSL !== 'false' && {
      dialectOptions: {
        ssl: {
          rejectUnauthorized: false,  // Accept self-signed certs
        },
        connectTimeout: 60000,
      },
    }),
    // No SSL mode for databases that don't support it
    ...(isProd && process.env.DB_SSL === 'false' && {
      dialectOptions: {
        connectTimeout: 60000,
      },
    }),
  }
);

// Import models
const User = require('./User')(sequelize);
const Technician = require('./Technician')(sequelize);
const Service = require('./Service')(sequelize);
const ServiceRequest = require('./ServiceRequest')(sequelize);
const Notification = require('./Notification')(sequelize);
const Review = require('./Review')(sequelize);
const Payment = require('./Payment')(sequelize);

// Associations
// User <-> ServiceRequest
User.hasMany(ServiceRequest, { foreignKey: 'userId', as: 'requests' });
ServiceRequest.belongsTo(User, { foreignKey: 'userId', as: 'customer' });

// Technician <-> ServiceRequest
Technician.hasMany(ServiceRequest, { foreignKey: 'technicianId', as: 'assignedRequests' });
ServiceRequest.belongsTo(Technician, { foreignKey: 'technicianId', as: 'technician' });

// Technician <-> User (one-to-one)
User.hasOne(Technician, { foreignKey: 'userId', as: 'technicianProfile' });
Technician.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Service <-> ServiceRequest
Service.hasMany(ServiceRequest, { foreignKey: 'serviceId', as: 'requests' });
ServiceRequest.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ServiceRequest <-> Review
ServiceRequest.hasOne(Review, { foreignKey: 'requestId', as: 'review' });
Review.belongsTo(ServiceRequest, { foreignKey: 'requestId', as: 'request' });

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'customer' });

Technician.hasMany(Review, { foreignKey: 'technicianId', as: 'reviews' });
Review.belongsTo(Technician, { foreignKey: 'technicianId', as: 'technician' });

// ServiceRequest <-> Payment
ServiceRequest.hasMany(Payment, { foreignKey: 'requestId', as: 'payments' });
Payment.belongsTo(ServiceRequest, { foreignKey: 'requestId', as: 'request' });

// User <-> Payment
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'payer' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Technician,
  Service,
  ServiceRequest,
  Notification,
  Review,
  Payment,
};
