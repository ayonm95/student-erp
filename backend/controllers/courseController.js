const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');

// 7. POST /api/courses - Create course (Admin)
const createCourse = async (req, res, next) => {
  try {
    const { courseCode, courseName, credits, semester, department } = req.body;

    // Manual validations
    if (!courseCode || typeof courseCode !== 'string' || !courseCode.trim()) {
      return res.status(400).json({ success: false, message: 'courseCode is required.', data: null });
    }
    if (!courseName || typeof courseName !== 'string' || !courseName.trim()) {
      return res.status(400).json({ success: false, message: 'courseName is required.', data: null });
    }
    const parsedCredits = Number(credits);
    if (!credits || isNaN(parsedCredits) || parsedCredits < 1 || parsedCredits > 10) {
      return res.status(400).json({ success: false, message: 'credits must be a number between 1 and 10.', data: null });
    }
    const parsedSem = Number(semester);
    if (!semester || isNaN(parsedSem) || parsedSem < 1 || parsedSem > 12) {
      return res.status(400).json({ success: false, message: 'semester must be a number between 1 and 12.', data: null });
    }
    if (!department || typeof department !== 'string' || !department.trim()) {
      return res.status(400).json({ success: false, message: 'department is required.', data: null });
    }

    const cleanCode = courseCode.toUpperCase().trim();
    const existing = await Course.findOne({ courseCode: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A course with this courseCode already exists.',
        data: null,
      });
    }

    const course = await Course.create({
      courseCode: cleanCode,
      courseName: courseName.trim(),
      credits: parsedCredits,
      semester: parsedSem,
      department: department.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// 8. GET /api/courses - List all courses (Admin, Student)
const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ courseCode: 1 });
    return res.status(200).json({
      success: true,
      message: 'Courses fetched successfully.',
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

// 9. PUT /api/courses/:id - Update course (Admin)
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { courseCode, courseName, credits, semester, department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Course ID format.', data: null });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.', data: null });
    }

    if (courseCode !== undefined) {
      if (typeof courseCode !== 'string' || !courseCode.trim()) {
        return res.status(400).json({ success: false, message: 'courseCode cannot be empty.', data: null });
      }
      const cleanCode = courseCode.toUpperCase().trim();
      const existing = await Course.findOne({ courseCode: cleanCode, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Another course with this code exists.', data: null });
      }
      course.courseCode = cleanCode;
    }

    if (courseName !== undefined) {
      if (typeof courseName !== 'string' || !courseName.trim()) {
        return res.status(400).json({ success: false, message: 'courseName cannot be empty.', data: null });
      }
      course.courseName = courseName.trim();
    }

    if (credits !== undefined) {
      const parsed = Number(credits);
      if (isNaN(parsed) || parsed < 1 || parsed > 10) {
        return res.status(400).json({ success: false, message: 'credits must be between 1 and 10.', data: null });
      }
      course.credits = parsed;
    }

    if (semester !== undefined) {
      const parsedSem = Number(semester);
      if (isNaN(parsedSem) || parsedSem < 1 || parsedSem > 12) {
        return res.status(400).json({ success: false, message: 'semester must be between 1 and 12.', data: null });
      }
      course.semester = parsedSem;
    }

    if (department !== undefined) {
      if (typeof department !== 'string' || !department.trim()) {
        return res.status(400).json({ success: false, message: 'department cannot be empty.', data: null });
      }
      course.department = department.trim();
    }

    await course.save();

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// 10. DELETE /api/courses/:id - Delete course (Admin)
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Course ID format.', data: null });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.', data: null });
    }

    // Cascade delete enrollments, attendance, and grades for this course
    await Enrollment.deleteMany({ course: id });
    await Attendance.deleteMany({ course: id });
    await Grade.deleteMany({ course: id });
    await Course.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Course and related records deleted successfully.',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse,
};
