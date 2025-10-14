const express = require('express');
const router = express.Router();
const servicioItemsController = require('../controllers/servicioItemsController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Catalog
router.get('/catalogo', servicioItemsController.getProductosCatalogo);

// Service items
router.get('/:servicio_id/items', servicioItemsController.getServicioItems);
router.post('/:servicio_id/items', servicioItemsController.addServicioItem);
router.delete('/items/:item_id', servicioItemsController.removeServicioItem);

// Discount and payment
router.post('/:servicio_id/discount', servicioItemsController.applyDiscount);
router.post('/:servicio_id/payment', servicioItemsController.processPayment);

module.exports = router;