const jwt = require('jsonwebtoken');

const getTokenFromHeader = (authHeader = '') => {
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

const protect = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization || '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorizeDoctor = (req, res, next) => {
  const role = (req.user?.role || '').toUpperCase();
  if (role !== 'DOCTOR') {
    return res.status(403).json({ success: false, message: 'Doctor role required' });
  }
  return next();
};

const authorizeDoctorAdminPatient = (req, res, next) => {
  const role = (req.user?.role || '').toUpperCase();
  const allowedRoles = ['DOCTOR', 'ADMIN', 'PATIENT'];

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      message: 'Doctor, Admin, or Patient role required',
    });
  }

  return next();
};

module.exports = { protect, authorizeDoctor, authorizeDoctorAdminPatient };
