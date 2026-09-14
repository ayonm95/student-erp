const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// 7. POST /api/courses - Create course (Admin)
router.post('/', requireRole('admin'), courseController.createCourse);

// 8. GET /api/courses - List courses (Admin, Student)
router.get('/', requireRole('admin', 'student'), courseController.getAllCourses);

// 9. PUT /api/courses/:id - Update course (Admin)
router.put('/:id', requireRole('admin'), courseController.updateCourse);

// 10. DELETE /api/courses/:id - Delete course (Admin)
router.delete('/:id', requireRole('admin'), courseController.deleteCourse);

module.exports = router;
