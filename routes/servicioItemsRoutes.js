const express = require('express');
const router = express.Router();
const servicioItemsController = require('../controllers/servicioItemsController');
const { authMiddleware, isAdminOrCliente } = require('../middleware/auth');
const pool = require('../config/database'); // CORRECT PATH

// Middleware to check if user can access/modify a specific servicio
const checkServiceAccess = async (req, res, next) => {
  try {
    console.log('🛒 servicioItems - User:', req.user);
    console.log('🛒 servicioItems - Servicio ID:', req.params.servicio_id);
    
    // Admins can access everything
    if (req.user.rol === 'admin') {
      console.log('✅ Admin access');
      return next();
    }
    
    // Clientes can only access their own services
    if (req.user.rol === 'cliente') {
      const servicioId = req.params.servicio_id;
      
      // Query database directly
      const result = await pool.query(
        'SELECT * FROM servicios WHERE id = $1',
        [servicioId]
      );
      
      const servicio = result.rows[0];
      console.log('📦 Found servicio:', servicio);
      
      if (!servicio) {
        return res.status(404).json({ error: 'Servicio not found' });
      }
      
      const userClienteId = req.user.cliente_id || req.user.id;
      console.log('🔑 Comparing - Servicio cliente_id:', servicio.cliente_id, 'vs User cliente_id:', userClienteId);
      
      if (servicio.cliente_id != userClienteId) {
        console.log('❌ Access denied');
        return res.status(403).json({ error: 'Access denied. Not your service.' });
      }
      
      console.log('✅ Cliente access');
      return next();
    }
    
    res.status(403).json({ error: 'Access denied. Invalid role.' });
  } catch (error) {
    console.error('❌ servicioItems checkServiceAccess error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Middleware to check if user can delete an item
const checkItemAccess = async (req, res, next) => {
  try {
    // Admins can delete anything
    if (req.user.rol === 'admin') {
      return next();
    }
    
    // Clientes can only delete items from their own services
    if (req.user.rol === 'cliente') {
      // Query item with servicio info
      const result = await pool.query(
        'SELECT si.*, s.cliente_id FROM servicio_items si JOIN servicios s ON si.servicio_id = s.id WHERE si.id = $1',
        [req.params.item_id]
      );
      
      const item = result.rows[0];
      
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      const userClienteId = req.user.cliente_id || req.user.id;
      
      if (item.cliente_id != userClienteId) {
        return res.status(403).json({ error: 'Access denied. Not your service.' });
      }
      
      return next();
    }
    
    res.status(403).json({ error: 'Access denied. Invalid role.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// All routes require authentication
router.use(authMiddleware);

// Catalog - Accessible by both admin and cliente
router.get('/catalogo', isAdminOrCliente, servicioItemsController.getProductosCatalogo);

// Service items - Cliente can access their own services
router.get('/:servicio_id/items', checkServiceAccess, servicioItemsController.getServicioItems);
router.post('/:servicio_id/items', checkServiceAccess, servicioItemsController.addServicioItem);
router.delete('/items/:item_id', checkItemAccess, servicioItemsController.removeServicioItem);

// Discount and payment - Cliente can manage their own services
router.post('/:servicio_id/discount', checkServiceAccess, servicioItemsController.applyDiscount);
router.post('/:servicio_id/payment', checkServiceAccess, servicioItemsController.processPayment);

module.exports = router;