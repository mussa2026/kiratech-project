const crypto = require('crypto');

/**
 * Generate a secure random token.
 */
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Paginate a Sequelize query result.
 */
const paginate = (page = 1, limit = 10) => {
  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (parsedPage - 1) * parsedLimit;
  return { limit: parsedLimit, offset, page: parsedPage };
};

/**
 * Build a pagination response object.
 */
const paginateResponse = (data, page, limit, total) => {
  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = { generateToken, paginate, paginateResponse };
