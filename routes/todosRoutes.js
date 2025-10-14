const express = require('express');
const router = express.Router();
const todosController = require('../controllers/todosController');
const { authMiddleware, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get todos for a servicio
router.get('/servicio/todos/:servicio_id', todosController.getTodosByServicio);

// Create todo for a servicio
router.post('/servicio/todos/:servicio_id', todosController.createTodo);

// Update todo
router.put('/:id', todosController.updateTodo);

// Toggle todo done status
router.patch('/:id/toggle', todosController.toggleTodo);

// Delete todo
router.delete('/:id', todosController.deleteTodo);

module.exports = router;