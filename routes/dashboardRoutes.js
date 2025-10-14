const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);
router.get('/monthly-income', dashboardController.getMonthlyIncome);
router.get('/worker-ranking', dashboardController.getWorkerRanking);
router.get('/income-by-service', dashboardController.getIncomeByService);
router.get('/income-by-payment', dashboardController.getIncomeByPayment);

module.exports = router;