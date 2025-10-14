const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const { authMiddleware, isAdmin, isOwnerOrAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Stats - admin only
router.get('/stats', isAdmin, clientesController.getClienteStats);

// CRUD operations
router.get('/', isAdmin, clientesController.getAllClientes); // Admin only - see all
router.get('/:id', isOwnerOrAdmin, clientesController.getClienteById); // Owner or admin
router.post('/', isAdmin, clientesController.createCliente); // Admin only
router.put('/:id', isAdmin, clientesController.updateCliente); // Admin only
router.delete('/:id', isAdmin, clientesController.deleteCliente); // Admin only

module.exports = router;