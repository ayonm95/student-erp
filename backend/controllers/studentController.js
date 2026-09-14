const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');

// 3. GET /api/students - List all students (Admin)
const getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Students fetched successfully.',
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// 4. GET /api/students/:id - Get one student profile (Admin, Owner)
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID format.',
        data: null,
      });
    }

    const student = await Student.findById(id).populate('userId', 'name email role');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student profile fetched successfully.',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// 5. PUT /api/students/:id - Update student profile (Admin)
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rollNumber, department, semester, name, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID format.',
        data: null,
      });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
        data: null,
      });
    }

    // Validation
    if (rollNumber !== undefined) {
      if (typeof rollNumber !== 'string' || !rollNumber.trim()) {
        return res.status(400).json({ success: false, message: 'Valid rollNumber is required.', data: null });
      }
      const cleanRoll = rollNumber.toUpperCase().trim();
      const existing = await Student.findOne({ rollNumber: cleanRoll, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Another student with this roll number already exists.',
          data: null,
        });
      }
      student.rollNumber = cleanRoll;
    }

    if (department !== undefined) {
      if (typeof department !== 'string' || !department.trim()) {
        return res.status(400).json({ success: false, message: 'Valid department is required.', data: null });
      }
      student.department = department.trim();
    }

    if (semester !== undefined) {
      const parsedSem = Number(semester);
      if (isNaN(parsedSem) || parsedSem < 1 || parsedSem > 12) {
        return res.status(400).json({ success: false, message: 'Semester must be between 1 and 12.', data: null });
      }
      student.semester = parsedSem;
    }

    await student.save();

    // Optionally update linked User name/email if provided
    if (name || email) {
      const user = await User.findById(student.userId);
      if (user) {
        if (name && typeof name === 'string' && name.trim()) {
          user.name = name.trim();
        }
        if (email && typeof email === 'string' && email.includes('@')) {
          const cleanEmail = email.toLowerCase().trim();
          const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
          if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email already in use.', data: null });
          }
          user.email = cleanEmail;
        }
        await user.save();
      }
    }

    const updatedStudent = await Student.findById(id).populate('userId', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully.',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

// 6. DELETE /api/students/:id - Delete student (Admin)
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID format.',
        data: null,
      });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
        data: null,
      });
    }

    // Cascade delete linked user, enrollments, attendance, and grades
    await User.findByIdAndDelete(student.userId);
    await Enrollment.deleteMany({ student: student._id });
    await Attendance.deleteMany({ student: student._id });
    await Grade.deleteMany({ student: student._id });
    await Student.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Student and related records deleted successfully.',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
