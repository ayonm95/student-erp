const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing or malformed. Bearer token required.',
        data: null,
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token not provided.',
        data: null,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'student_erp_super_secret_jwt_key_2026_cia');
    // Attach decoded user info: { id, role }
    req.user = {
      id: decoded.userId || decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      data: null,
    });
  }
};

module.exports = authMiddleware;
