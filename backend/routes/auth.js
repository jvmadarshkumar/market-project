const express = require('express');
const router = express.Router();
const { signup, login, verifyOTP, forgotPassword, resetPassword, changePassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.patch('/change-password', auth, changePassword);

module.exports = router;
