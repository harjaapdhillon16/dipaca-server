const pool = require('../config/database');

// Get all items for a servicio
exports.getServicioItems = async (req, res) => {
  try {
    const { servicio_id } = req.params;

    // Verify the servicio belongs to the logged-in cliente
    const servicioCheck = await pool.query(
      'SELECT cliente_id FROM servicios WHERE id = $1',
      [servicio_id]
    );

    if (servicioCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio not found' });
    }

    // For cliente users, verify ownership
    if (req.user.rol === 'cliente' && servicioCheck.rows[0].cliente_id !== req.user.cliente_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM servicio_items WHERE servicio_id = $1 ORDER BY created_at ASC',
      [servicio_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching servicio items:', error);
    res.status(500).json({ error: 'Error fetching servicio items' });
  }
};

// Add item to servicio
exports.addServicioItem = async (req, res) => {
  try {
    const { servicio_id } = req.params;
    const { nombre, precio } = req.body;

    // Verify access
    const servicioCheck = await pool.query(
      'SELECT cliente_id, monto FROM servicios WHERE id = $1',
      [servicio_id]
    );

    if (servicioCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio not found' });
    }

    if (req.user.rol === 'cliente' && servicioCheck.rows[0].cliente_id !== req.user.cliente_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add item
    const result = await pool.query(
      'INSERT INTO servicio_items (servicio_id, nombre, precio) VALUES ($1, $2, $3) RETURNING *',
      [servicio_id, nombre, precio]
    );

    // Update servicio total
    await pool.query(
      'UPDATE servicios SET monto = monto + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [precio, servicio_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding servicio item:', error);
    res.status(500).json({ error: 'Error adding servicio item' });
  }
};

// Remove item from servicio
exports.removeServicioItem = async (req, res) => {
  try {
    const { item_id } = req.params;

    // Get item details
    const itemResult = await pool.query(
      'SELECT si.*, s.cliente_id FROM servicio_items si JOIN servicios s ON si.servicio_id = s.id WHERE si.id = $1',
      [item_id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = itemResult.rows[0];

    // Verify access
    if (req.user.rol === 'cliente' && item.cliente_id !== req.user.cliente_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete item
    await pool.query('DELETE FROM servicio_items WHERE id = $1', [item_id]);

    // Update servicio total
    await pool.query(
      'UPDATE servicios SET monto = GREATEST(0, monto - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [item.precio, item.servicio_id]
    );

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error removing servicio item:', error);
    res.status(500).json({ error: 'Error removing servicio item' });
  }
};

// Get productos catalog
exports.getProductosCatalogo = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM productos_catalogo WHERE activo = true ORDER BY nombre ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching productos catalogo:', error);
    res.status(500).json({ error: 'Error fetching productos catalogo' });
  }
};

// Apply discount
exports.applyDiscount = async (req, res) => {
  try {
    const { servicio_id } = req.params;
    const { puntos_usados, descuento } = req.body;

    // Verify access
    const servicioCheck = await pool.query(
      'SELECT cliente_id FROM servicios WHERE id = $1',
      [servicio_id]
    );

    if (servicioCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio not found' });
    }

    if (req.user.rol === 'cliente' && servicioCheck.rows[0].cliente_id !== req.user.cliente_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update discount
    await pool.query(
      'UPDATE servicios SET descuento = $1, puntos_usados = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [descuento, puntos_usados, servicio_id]
    );

    res.json({ message: 'Discount applied successfully' });
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({ error: 'Error applying discount' });
  }
};

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const { servicio_id } = req.params;
    const { metodo_pago, propina } = req.body;

    // Verify access
    const servicioCheck = await pool.query(
      'SELECT cliente_id FROM servicios WHERE id = $1',
      [servicio_id]
    );

    if (servicioCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio not found' });
    }

    if (req.user.rol === 'cliente' && servicioCheck.rows[0].cliente_id !== req.user.cliente_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update servicio
    await pool.query(
      `UPDATE servicios 
       SET metodo_pago = $1, propina = $2, status = 'FINALIZADO', 
           cancelado = true, hora_salida = CURRENT_TIME, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [metodo_pago, propina, servicio_id]
    );

    res.json({ message: 'Payment processed successfully' });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Error processing payment' });
  }
};

module.exports = exports;