const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Preview sequential roll number for registration
router.get('/next-roll-number', authController.getNextRollNumber);

// 1. POST /api/auth/register - Student self-signup
router.post('/register', authController.register);

// 2. POST /api/auth/login - Login (Admin or Student)
router.post('/login', authController.login);

module.exports = router;
