const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      ...decoded,
      role: String(decoded.role || "").toLowerCase(),
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token.",
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized.",
      });
    }

    const allowedRoles = roles.map((role) => String(role).toLowerCase());
    const userRole = String(req.user.role || "").toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this route.",
      });
    }
    next();
  };
};