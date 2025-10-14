const express = require('express');
const router = express.Router();
const vehiculosController = require('../controllers/vehiculosController');
const { authMiddleware, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// CRUD operations - Admin only
router.get('/', isAdmin, vehiculosController.getAllVehiculos);
router.get('/:id', isAdmin, vehiculosController.getVehiculoById);
router.post('/', isAdmin, vehiculosController.createVehiculo);
router.put('/:id', isAdmin, vehiculosController.updateVehiculo);
router.delete('/:id', isAdmin, vehiculosController.deleteVehiculo);

module.exports = router;