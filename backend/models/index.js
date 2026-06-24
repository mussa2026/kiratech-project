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
    pool: { max: isProd ? 5 : 10, min: 0, acquire: 30000, idle: 10000 },
    ...(isProd && process.env.DB_SSL !== 'false' && {
      dialectOptions: { ssl: { rejectUnauthorized: false }, connectTimeout: 60000 },
    }),
    ...(isProd && process.env.DB_SSL === 'false' && {
      dialectOptions: { connectTimeout: 60000 },
    }),
  }
);

// ── Import models ─────────────────────────────────────────────────────────────
const User               = require('./User')(sequelize);
const Technician         = require('./Technician')(sequelize);
const Service            = require('./Service')(sequelize);
const ServiceRequest     = require('./ServiceRequest')(sequelize);
const Notification       = require('./Notification')(sequelize);
const Review             = require('./Review')(sequelize);
const Payment            = require('./Payment')(sequelize);
const TechnicianMessage  = require('./TechnicianMessage')(sequelize);

// ── Associations ──────────────────────────────────────────────────────────────
User.hasMany(ServiceRequest, { foreignKey: 'userId', as: 'requests' });
ServiceRequest.belongsTo(User, { foreignKey: 'userId', as: 'customer' });

Technician.hasMany(ServiceRequest, { foreignKey: 'technicianId', as: 'assignedRequests' });
ServiceRequest.belongsTo(Technician, { foreignKey: 'technicianId', as: 'technician' });

User.hasOne(Technician, { foreignKey: 'userId', as: 'technicianProfile' });
Technician.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Service.hasMany(ServiceRequest, { foreignKey: 'serviceId', as: 'requests' });
ServiceRequest.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ServiceRequest.hasOne(Review, { foreignKey: 'requestId', as: 'review' });
Review.belongsTo(ServiceRequest, { foreignKey: 'requestId', as: 'request' });

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'customer' });

Technician.hasMany(Review, { foreignKey: 'technicianId', as: 'reviews' });
Review.belongsTo(Technician, { foreignKey: 'technicianId', as: 'technician' });

ServiceRequest.hasMany(Payment, { foreignKey: 'requestId', as: 'payments' });
Payment.belongsTo(ServiceRequest, { foreignKey: 'requestId', as: 'request' });

User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'payer' });

// Technician ↔ TechnicianMessage
Technician.hasMany(TechnicianMessage, { foreignKey: 'senderId',   as: 'sentMessages' });
Technician.hasMany(TechnicianMessage, { foreignKey: 'receiverId', as: 'receivedMessages' });
TechnicianMessage.belongsTo(Technician, { foreignKey: 'senderId',   as: 'sender' });
TechnicianMessage.belongsTo(Technician, { foreignKey: 'receiverId', as: 'receiver' });

// TechnicianMessage ↔ ServiceRequest (optional task context)
ServiceRequest.hasMany(TechnicianMessage, { foreignKey: 'requestId', as: 'chatMessages' });
TechnicianMessage.belongsTo(ServiceRequest, { foreignKey: 'requestId', as: 'linkedRequest' });

module.exports = {
  sequelize, Sequelize,
  User, Technician, Service, ServiceRequest,
  Notification, Review, Payment, TechnicianMessage,
};
