const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole, checkOwnership } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// 14. POST /api/attendance - Mark attendance (Admin)
router.post('/', requireRole('admin'), attendanceController.markAttendance);

// Helper GET /api/attendance - View all attendance records (Admin)
router.get('/', requireRole('admin'), attendanceController.getAllAttendance);

// 15. GET /api/attendance/student/:id - View attendance record (Admin, Owner)
router.get('/student/:id', checkOwnership, attendanceController.getStudentAttendance);

// 16. PUT /api/attendance/:id - Correct attendance entry (Admin)
router.put('/:id', requireRole('admin'), attendanceController.updateAttendance);

module.exports = router;
