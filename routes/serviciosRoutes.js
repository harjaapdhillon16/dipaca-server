const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/serviciosController');
const { authMiddleware, isAdmin } = require('../middleware/auth');
const pool = require('../config/database'); // CORRECT PATH

// Middleware to check if user can access a specific servicio
const checkServiceAccess = async (req, res, next) => {
  try {
    console.log('🔍 checkServiceAccess - User:', req.user);
    console.log('🔍 checkServiceAccess - Servicio ID:', req.params.id);
    
    // Admins can access everything
    if (req.user.rol === 'admin') {
      console.log('✅ Admin access granted');
      return next();
    }
    
    // Clientes can only access their own services
    if (req.user.rol === 'cliente') {
      // Query database directly
      const result = await pool.query(
        'SELECT * FROM servicios WHERE id = $1',
        [req.params.id]
      );
      
      const servicio = result.rows[0];
      console.log('📦 Found servicio:', servicio);
      
      if (!servicio) {
        console.log('❌ Servicio not found');
        return res.status(404).json({ error: 'Servicio not found' });
      }
      
      const userClienteId = req.user.cliente_id || req.user.id;
      console.log('🔑 Comparing - Servicio cliente_id:', servicio.cliente_id, 'vs User cliente_id:', userClienteId);
      
      if (servicio.cliente_id != userClienteId) {
        console.log('❌ Access denied - not the owner');
        return res.status(403).json({ error: 'Access denied. Not your service.' });
      }
      
      console.log('✅ Cliente access granted');
      return next();
    }
    
    console.log('❌ No valid role');
    res.status(403).json({ error: 'Access denied. Invalid role.' });
  } catch (error) {
    console.error('❌ checkServiceAccess error:', error);
    res.status(500).json({ error: error.message });
  }
};

// All routes require authentication
router.use(authMiddleware);

// Stats - ADMIN ONLY
router.get('/stats', isAdmin, serviciosController.getServicioStats);

// Special queries - ADMIN ONLY
router.get('/active', isAdmin, serviciosController.getActiveServicios);
router.get('/completed', isAdmin, serviciosController.getCompletedServicios);

// CRUD operations
router.get('/', isAdmin, serviciosController.getAllServicios);
router.get('/:id', checkServiceAccess, serviciosController.getServicioById);
router.post('/', isAdmin, serviciosController.createServicio);
router.put('/:id', isAdmin, serviciosController.updateServicio);
router.patch('/:id/status', isAdmin, serviciosController.updateServicioStatus);
router.delete('/:id', isAdmin, serviciosController.deleteServicio);

module.exports = router;