const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole, checkOwnership } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// 17. POST /api/grades - Enter grade (Admin)
router.post('/', requireRole('admin'), gradeController.enterGrade);

// Helper GET /api/grades - View all grades (Admin)
router.get('/', requireRole('admin'), gradeController.getAllGrades);

// 18. GET /api/grades/student/:id - View grades (Admin, Owner)
router.get('/student/:id', checkOwnership, gradeController.getStudentGrades);

// 19. PUT /api/grades/:id - Update grade (Admin)
router.put('/:id', requireRole('admin'), gradeController.updateGrade);

// 20. DELETE /api/grades/:id - Delete grade entry (Admin)
router.delete('/:id', requireRole('admin'), gradeController.deleteGrade);

module.exports = router;
