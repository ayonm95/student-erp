const Student = require('../models/Student');
const mongoose = require('mongoose');

// Verify if logged in user has one of the allowed roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: insufficient role permissions.',
        data: null,
      });
    }
    next();
  };
};

// Verify if user is admin OR the owner student corresponding to :id parameter
const checkOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
        data: null,
      });
    }

    // Admins can access any student record
    if (req.user.role === 'admin') {
      return next();
    }

    // If user is student, ensure the requested student :id matches their student profile
    if (req.user.role === 'student') {
      const studentIdParam = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(studentIdParam)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Student ID format.',
          data: null,
        });
      }

      const ownStudentProfile = await Student.findOne({ userId: req.user.id });
      if (!ownStudentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Student profile associated with this account not found.',
          data: null,
        });
      }

      if (ownStudentProfile._id.toString() !== studentIdParam) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: You can only view your own student records.',
          data: null,
        });
      }

      // Attach own student profile to request
      req.student = ownStudentProfile;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access forbidden: unrecognized role.',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireRole,
  checkOwnership,
};
