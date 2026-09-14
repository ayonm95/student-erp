const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Course = require('../models/Course');

// 11. POST /api/enrollment - Enroll student in course (Admin)
const enrollStudent = async (req, res, next) => {
  try {
    const { student, course, academicYear } = req.body;

    if (!student || !mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required.', data: null });
    }
    if (!course || !mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ success: false, message: 'Valid course ID is required.', data: null });
    }
    if (!academicYear || typeof academicYear !== 'string' || !academicYear.trim()) {
      return res.status(400).json({ success: false, message: 'academicYear is required (e.g., 2025-2026).', data: null });
    }

    const studentDoc = await Student.findById(student);
    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student not found.', data: null });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ success: false, message: 'Course not found.', data: null });
    }

    const cleanYear = academicYear.trim();

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
      .populate('student')
      .populate('course');

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

// 13. DELETE /api/enrollment/:id - Unenroll student from course (Admin)
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
