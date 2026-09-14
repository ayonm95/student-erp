const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const User = require('../models/User');

// 11. POST /api/enrollment - Enroll student in course (Admin or Student self-enroll)
const enrollStudent = async (req, res, next) => {
  try {
    let { student, course, academicYear } = req.body;

    // If user is a student, automatically resolve their linked Student record
    if (req.user && req.user.role === 'student') {
      const studentProfile = await Student.findOne({ userId: req.user.id });
      if (!studentProfile) {
        return res.status(404).json({ success: false, message: 'Student profile not found for this account.', data: null });
      }
      student = studentProfile._id.toString();
    }

    if (!student || !mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required.', data: null });
    }
    if (!course || !mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ success: false, message: 'Valid course ID is required.', data: null });
    }

    // Default academicYear if not provided
    const currentYear = new Date().getFullYear();
    const defaultAcademicYear = `${currentYear}-${currentYear + 1}`;
    const cleanYear = (academicYear && typeof academicYear === 'string' && academicYear.trim())
      ? academicYear.trim()
      : defaultAcademicYear;

    const studentDoc = await Student.findById(student);
    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student not found.', data: null });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ success: false, message: 'Course not found.', data: null });
    }

    // Check duplicate enrollment
    const existing = await Enrollment.findOne({
      student,
      course,
      academicYear: cleanYear,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course for the specified academic year.',
        data: null,
      });
    }

    const enrollment = await Enrollment.create({
      student,
      course,
      academicYear: cleanYear,
    });

    const populated = await Enrollment.findById(enrollment._id)
      .populate('course')
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'name email' },
      });

    return res.status(201).json({
      success: true,
      message: 'Student enrolled in course successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// 12. GET /api/enrollment/student/:id - View a student's enrollments (Admin, Owner)
const getStudentEnrollments = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Student ID format.', data: null });
    }

    const enrollments = await Enrollment.find({ student: id })
      .populate('course')
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Enrollments fetched successfully.',
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};

// 13. DELETE /api/enrollment/:id - Unenroll student from course (Admin or Student self-drop)
const unenrollStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Enrollment ID format.', data: null });
    }

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found.', data: null });
    }

    // If student role, ensure student owns this enrollment
    if (req.user && req.user.role === 'student') {
      const studentProfile = await Student.findOne({ userId: req.user.id });
      if (!studentProfile || enrollment.student.toString() !== studentProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only drop your own enrolled courses.',
          data: null,
        });
      }
    }

    // Check if attendance or grades already exist for this student and course
    const [attCount, gradeCount] = await Promise.all([
      Attendance.countDocuments({ student: enrollment.student, course: enrollment.course }),
      Grade.countDocuments({ student: enrollment.student, course: enrollment.course }),
    ]);

    if (attCount > 0 || gradeCount > 0) {
      const reasons = [];
      if (attCount > 0) reasons.push(`${attCount} attendance session(s)`);
      if (gradeCount > 0) reasons.push(`${gradeCount} grade evaluation(s)`);
      return res.status(400).json({
        success: false,
        message: `Cannot unenroll from this course because ${reasons.join(' and ')} already exist for this subject. Please contact the administration.`,
        data: null,
      });
    }

    await Enrollment.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Student unenrolled from course successfully.',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

// Helper for Admin Dashboard to view all enrollments
const getAllEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('course')
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'All enrollments fetched successfully.',
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enrollStudent,
  getStudentEnrollments,
  unenrollStudent,
  getAllEnrollments,
};
