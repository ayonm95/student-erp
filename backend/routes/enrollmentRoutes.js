const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole, checkOwnership } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// 11. POST /api/enrollment - Enroll student in course (Admin)
router.post('/', requireRole('admin'), enrollmentController.enrollStudent);

// Helper GET /api/enrollment - View all enrollments (Admin)
router.get('/', requireRole('admin'), enrollmentController.getAllEnrollments);

// 12. GET /api/enrollment/student/:id - View a student's enrollments (Admin, Owner)
router.get('/student/:id', checkOwnership, enrollmentController.getStudentEnrollments);

// 13. DELETE /api/enrollment/:id - Unenroll (Admin)
router.delete('/:id', requireRole('admin'), enrollmentController.unenrollStudent);

module.exports = router;
