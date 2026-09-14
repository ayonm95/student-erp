const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Course = require('../models/Course');

// 14. POST /api/attendance - Mark attendance (Admin)
const markAttendance = async (req, res, next) => {
  try {
    const { student, course, date, status } = req.body;

    if (!student || !mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required.', data: null });
    }
    if (!course || !mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ success: false, message: 'Valid course ID is required.', data: null });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Valid date is required.', data: null });
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format.', data: null });
    }
    if (!status || !['present', 'absent'].includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Status is required and must be either "present" or "absent".',
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

    const attendance = await Attendance.create({
      student,
      course,
      date: parsedDate,
      status: status.toLowerCase(),
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('student')
      .populate('course');

    return res.status(201).json({
      success: true,
      message: 'Attendance marked successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// 15. GET /api/attendance/student/:id - View attendance record (Admin, Owner)
const getStudentAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Student ID format.', data: null });
    }

    const attendanceRecords = await Attendance.find({ student: id })
      .populate('course')
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      message: 'Student attendance records fetched successfully.',
      data: attendanceRecords,
    });
  } catch (error) {
    next(error);
  }
};

// 16. PUT /api/attendance/:id - Correct attendance entry (Admin)
const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Attendance ID format.', data: null });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.', data: null });
    }

    if (status !== undefined) {
      if (!['present', 'absent'].includes(status.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either "present" or "absent".',
          data: null,
        });
      }
      attendance.status = status.toLowerCase();
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format.', data: null });
      }
      attendance.date = parsedDate;
    }

    await attendance.save();

    const populated = await Attendance.findById(id)
      .populate('course')
      .populate('student');

    return res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// Helper for Admin Dashboard: Get all attendance logs
const getAllAttendance = async (req, res, next) => {
  try {
    const records = await Attendance.find()
      .populate('course')
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      message: 'All attendance records fetched successfully.',
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getStudentAttendance,
  updateAttendance,
  getAllAttendance,
};
