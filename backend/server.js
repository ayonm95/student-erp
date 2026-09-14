require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const gradeRoutes = require('./routes/gradeRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const bcrypt = require('bcryptjs');
const User = require('./models/User');

const ensureAdminAccount = async () => {
  if (!process.env.MONGO_URI) return;
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@erp.edu').toLowerCase().trim();
    const existing = await User.findOne({ role: 'admin' });
    if (!existing) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass@123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log(`[Auto-Seed]: Initial Admin account created: ${adminEmail}`);
    }
  } catch (err) {
    console.error('[Auto-Seed Warning]:', err.message);
  }
};

// Initialize Database connection and auto-seed admin if missing
if (process.env.MONGO_URI) {
  connectDB()
    .then(() => ensureAdminAccount())
    .catch((err) => console.error('[DB Startup Error]:', err.message));
}

// Middleware: ensure database connection is established before route execution in serverless
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Database connection error. Please verify MONGO_URI in environment variables.',
      data: null,
    });
  }
});

// Health Check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student ERP API server is healthy and running.',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);

// Catch-all 404 Route for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: [${req.method}] ${req.originalUrl}`,
    data: null,
  });
});

// Centralized error handling middleware (must be mounted last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  Student ERP Backend Server active on port ${PORT}`);
    console.log(`  Healthcheck: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}

module.exports = app;
