const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

const DEPARTMENT_CODES = {
  'computer science': 'CS',
  'information technology': 'IT',
  'electronics & communication': 'EC',
  'electrical engineering': 'EE',
  'mechanical engineering': 'ME',
  'civil engineering': 'CE',
  'data science & ai': 'DS',
};

const getDeptCode = (department) => {
  if (!department) return 'CS';
  const clean = department.trim().toLowerCase();
  if (DEPARTMENT_CODES[clean]) return DEPARTMENT_CODES[clean];
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
};

const generateNextRollNumber = async (department, year) => {
  const deptCode = getDeptCode(department);
  const currentYear = year || new Date().getFullYear();
  const prefix = `${deptCode}${currentYear}`;

  const existingStudents = await Student.find({
    rollNumber: new RegExp(`^${prefix}`, 'i'),
  }).select('rollNumber');

  let maxSeq = 0;
  for (const s of existingStudents) {
    const suffix = s.rollNumber.substring(prefix.length);
    const num = parseInt(suffix, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
};

// GET /api/auth/next-roll-number - Preview next sequential roll number
const getNextRollNumber = async (req, res, next) => {
  try {
    const { department, year } = req.query;
    if (!department) {
      return res.status(400).json({ success: false, message: 'Department query parameter is required.', data: null });
    }
    const rollNumber = await generateNextRollNumber(department, year ? Number(year) : undefined);
    return res.status(200).json({
      success: true,
      message: 'Next sequential roll number calculated successfully.',
      data: { rollNumber, department, year: year || new Date().getFullYear() },
    });
  } catch (error) {
    next(error);
  }
};

// 1. POST /api/auth/register - Student self-signup
const register = async (req, res, next) => {
  try {
    let { name, email, password, rollNumber, department, semester } = req.body;

    // Manual validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required and must be text.', data: null });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email is required.', data: null });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters long.',
        data: null,
      });
    }
    if (!department || typeof department !== 'string' || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Department is required.', data: null });
    }
    const parsedSemester = Number(semester);
    if (!semester || isNaN(parsedSemester) || parsedSemester < 1 || parsedSemester > 12) {
      return res.status(400).json({
        success: false,
        message: 'Semester must be a valid number between 1 and 12.',
        data: null,
      });
    }

    // If roll number not provided or empty, auto-generate sequential roll number
    if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
      rollNumber = await generateNextRollNumber(department);
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRoll = rollNumber.toUpperCase().trim();

    // Check existing User email
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
        data: null,
      });
    }

    // Check existing Student rollNumber
    const existingRoll = await Student.findOne({ rollNumber: cleanRoll });
    if (existingRoll) {
      return res.status(400).json({
        success: false,
        message: 'A student with this roll number already exists.',
        data: null,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User record with role 'student'
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'student',
    });

    // Create linked Student profile
    const newStudent = await Student.create({
      userId: newUser._id,
      rollNumber: cleanRoll,
      department: department.trim(),
      semester: parsedSemester,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'student_erp_super_secret_jwt_key_2026_cia',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully.',
      data: {
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          studentId: newStudent._id,
          rollNumber: newStudent.rollNumber,
          department: newStudent.department,
          semester: newStudent.semester,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. POST /api/auth/login - Login for Admin or Student
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Manual validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
        data: null,
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
        data: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
        data: null,
      });
    }

    // If student, find linked Student profile
    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await Student.findOne({ userId: user._id });
    }

    // Sign JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'student_erp_super_secret_jwt_key_2026_cia',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: studentProfile ? studentProfile._id : null,
          rollNumber: studentProfile ? studentProfile.rollNumber : null,
          department: studentProfile ? studentProfile.department : null,
          semester: studentProfile ? studentProfile.semester : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getNextRollNumber,
};
