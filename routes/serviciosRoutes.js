const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/serviciosController');
const { authMiddleware, isAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(isAdmin);

// Stats
router.get('/stats', serviciosController.getServicioStats);

// Special queries
router.get('/active', serviciosController.getActiveServicios);
router.get('/completed', serviciosController.getCompletedServicios);

// CRUD operations
router.get('/', serviciosController.getAllServicios);
router.get('/:id', serviciosController.getServicioById);
router.post('/', serviciosController.createServicio);
router.put('/:id', serviciosController.updateServicio);
router.patch('/:id/status', serviciosController.updateServicioStatus);
router.delete('/:id', serviciosController.deleteServicio);

module.exports = router;