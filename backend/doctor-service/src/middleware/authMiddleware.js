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

    const secret = process.env.JWT_SECRET || 'ufjkrm*$&+!=JfldsJKLfesadk421!@$45922dakjfsafdafa38fjkdjasKLJKFAF';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('[Doctor Auth Error]:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
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
