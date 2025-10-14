const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.post('/register-cliente', authController.registerCliente);
router.get('/verify', authController.verifyToken);

// Protected routes (admin only)
router.post('/register-admin', authMiddleware, isAdmin, authController.registerAdmin);

module.exports = router;