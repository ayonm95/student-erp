const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const VALID_EXAM_TYPES = ['internal1', 'internal2', 'external'];

// 17. POST /api/grades - Enter grade (Admin)
const enterGrade = async (req, res, next) => {
  try {
    const { student, course, examType, marksObtained, maxMarks } = req.body;

    if (!student || !mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required.', data: null });
    }
    if (!course || !mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ success: false, message: 'Valid course ID is required.', data: null });
    }
    if (!examType || !VALID_EXAM_TYPES.includes(examType)) {
      return res.status(400).json({
        success: false,
        message: `examType must be one of: ${VALID_EXAM_TYPES.join(', ')}.`,
        data: null,
      });
    }

    const marksNum = Number(marksObtained);
    const maxMarksNum = Number(maxMarks);

    if (marksObtained === undefined || isNaN(marksNum) || marksNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'marksObtained must be a positive number or zero.',
        data: null,
      });
    }
    if (maxMarks === undefined || isNaN(maxMarksNum) || maxMarksNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'maxMarks must be a number greater than zero.',
        data: null,
      });
    }
    if (marksNum > maxMarksNum) {
      return res.status(400).json({
        success: false,
        message: 'marksObtained cannot be greater than maxMarks.',
        data: null,
      });
    }

    const studentDoc = await Student.findById(student);
    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student not found.', data: null });
    }
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ success: false, message: 'Course not found.', data: null });
    }

    // Check if student is actually enrolled in this course
    const isEnrolled = await Enrollment.findOne({ student, course });
    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: `Student is not enrolled in course ${courseDoc.courseCode} (${courseDoc.courseName}). Grades cannot be recorded for non-enrolled courses.`,
        data: null,
      });
    }

    // Check for duplicate grade entry for same student, course, and examType
    const existingGrade = await Grade.findOne({ student, course, examType });
    if (existingGrade) {
      return res.status(400).json({
        success: false,
        message: `Grade marks for '${examType}' have already been recorded for this student in ${courseDoc.courseCode}. Please edit the existing grade record instead.`,
        data: null,
      });
    }

    const grade = await Grade.create({
      student,
      course,
      examType,
      marksObtained: marksNum,
      maxMarks: maxMarksNum,
    });

    const populated = await Grade.findById(grade._id)
      .populate('course')
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'name email' },
      });

    return res.status(201).json({
      success: true,
      message: 'Grade recorded successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// 18. GET /api/grades/student/:id - View grades (Admin, Owner)
const getStudentGrades = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Student ID format.', data: null });
    }

    const grades = await Grade.find({ student: id })
      .populate('course')
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Student grades fetched successfully.',
      data: grades,
    });
  } catch (error) {
    next(error);
  }
};

// 19. PUT /api/grades/:id - Update grade (Admin)
const updateGrade = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { examType, marksObtained, maxMarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Grade ID format.', data: null });
    }

    const grade = await Grade.findById(id);
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade record not found.', data: null });
    }

    if (examType !== undefined) {
      if (!VALID_EXAM_TYPES.includes(examType)) {
        return res.status(400).json({
          success: false,
          message: `examType must be one of: ${VALID_EXAM_TYPES.join(', ')}.`,
          data: null,
        });
      }
      grade.examType = examType;
    }

    let newMarks = grade.marksObtained;
    let newMax = grade.maxMarks;

    if (maxMarks !== undefined) {
      const parsedMax = Number(maxMarks);
      if (isNaN(parsedMax) || parsedMax <= 0) {
        return res.status(400).json({ success: false, message: 'maxMarks must be greater than zero.', data: null });
      }
      newMax = parsedMax;
      grade.maxMarks = newMax;
    }

    if (marksObtained !== undefined) {
      const parsedMarks = Number(marksObtained);
      if (isNaN(parsedMarks) || parsedMarks < 0) {
        return res.status(400).json({ success: false, message: 'marksObtained must be 0 or positive.', data: null });
      }
      newMarks = parsedMarks;
      grade.marksObtained = newMarks;
    }

    if (newMarks > newMax) {
      return res.status(400).json({
        success: false,
        message: 'marksObtained cannot exceed maxMarks.',
        data: null,
      });
    }

    await grade.save();

    const populated = await Grade.findById(id)
      .populate('course')
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'name email' },
      });

    return res.status(200).json({
      success: true,
      message: 'Grade updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// 20. DELETE /api/grades/:id - Delete grade entry (Admin)
const deleteGrade = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Grade ID format.', data: null });
    }

    const grade = await Grade.findById(id);
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade record not found.', data: null });
    }

    await Grade.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Grade record deleted successfully.',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

// Helper for Admin Dashboard: Get all grades
const getAllGrades = async (req, res, next) => {
  try {
    const grades = await Grade.find()
      .populate('course')
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'All grades fetched successfully.',
      data: grades,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enterGrade,
  getStudentGrades,
  updateGrade,
  deleteGrade,
  getAllGrades,
};
