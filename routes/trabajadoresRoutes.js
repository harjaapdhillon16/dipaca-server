const express = require('express');
const router = express.Router();
const trabajadoresController = require('../controllers/trabajadoresController');
const { authMiddleware, isAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(isAdmin);

// Stats
router.get('/stats', trabajadoresController.getTrabajadorStats);

// CRUD operations
router.get('/', trabajadoresController.getAllTrabajadores);
router.get('/:id', trabajadoresController.getTrabajadorById);
router.post('/', trabajadoresController.createTrabajador);
router.put('/:id', trabajadoresController.updateTrabajador);
router.delete('/:id', trabajadoresController.deleteTrabajador);

module.exports = router;