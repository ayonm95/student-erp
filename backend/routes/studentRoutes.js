const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole, checkOwnership } = require('../middleware/roleMiddleware');

// All student routes require valid JWT auth
router.use(authMiddleware);

// 3. GET /api/students - List all students (Admin)
router.get('/', requireRole('admin'), studentController.getAllStudents);

// 4. GET /api/students/:id - Get one student profile (Admin, Owner)
router.get('/:id', checkOwnership, studentController.getStudentById);

// 5. PUT /api/students/:id - Update student profile (Admin)
router.put('/:id', requireRole('admin'), studentController.updateStudent);

// 6. DELETE /api/students/:id - Delete student (Admin)
router.delete('/:id', requireRole('admin'), studentController.deleteStudent);

module.exports = router;
