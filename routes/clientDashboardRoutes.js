const express = require('express');
const router = express.Router();
const clientDashboardController = require('../controllers/clientDashboardController');
const { authMiddleware, isCliente } = require('../middleware/auth');

// All routes require authentication as cliente
router.use(authMiddleware);
router.use(isCliente);

// Dashboard routes
router.get('/dashboard', clientDashboardController.getClientDashboard);
router.get('/active-services', clientDashboardController.getMyActiveServices);
router.get('/info', clientDashboardController.getMyInfo);
router.get('/services', clientDashboardController.getMyServices);
router.get('/vehicles', clientDashboardController.getMyVehicles);
router.put('/profile', clientDashboardController.updateMyProfile);

module.exports = router;