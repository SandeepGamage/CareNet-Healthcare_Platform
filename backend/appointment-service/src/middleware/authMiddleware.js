const jwt = require('jsonwebtoken');

// Verify JWT token on protected routes (resilient auth)
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token  = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'ufjkrm*$&+!=JfldsJKLfesadk421!@$45922dakjfsafdafa38fjkdjasKLJKFAF';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;   // { id, email, role } available in all controllers
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

// Only allow specific roles through
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }
    const userRole = (req.user.role || '').toUpperCase();
    const allowedRoles = roles.map(r => r.toUpperCase());
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };