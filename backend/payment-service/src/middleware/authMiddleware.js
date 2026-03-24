const jwt    = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * protect — verifies JWT from Authorization: Bearer <token>
 * Adds req.user = { userId, role, email, name }
 */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { userId, role, email, name }
    next();
  } catch (error) {
    logger.warn(`Auth error: ${error.message}`);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * authorize — checks req.user.role against allowed roles
 * Must be used after protect
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
