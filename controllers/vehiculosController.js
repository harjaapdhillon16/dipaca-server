const pool = require('../config/database');

// Get all vehicles
exports.getAllVehiculos = async (req, res) => {
  try {
    const { search, cliente_id } = req.query;
    let query = `
      SELECT v.*, c.nombre || ' ' || c.apellido as cliente_nombre
      FROM vehiculos v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (v.placa ILIKE $${paramCount} OR v.marca ILIKE $${paramCount} OR v.modelo ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (cliente_id) {
      query += ` AND v.cliente_id = $${paramCount}`;
      params.push(cliente_id);
    }

    query += ' ORDER BY v.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vehiculos:', error);
    res.status(500).json({ error: 'Error fetching vehiculos' });
  }
};

// Get single vehicle
exports.getVehiculoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT v.*, c.nombre || ' ' || c.apellido as cliente_nombre
       FROM vehiculos v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       WHERE v.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Error fetching vehicle' });
  }
};

// Create vehicle
exports.createVehiculo = async (req, res) => {
  try {
    const { placa, marca, modelo, tipo, cliente_id } = req.body;

    const result = await pool.query(
      'INSERT INTO vehiculos (placa, marca, modelo, tipo, cliente_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [placa, marca, modelo, tipo, cliente_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Placa already exists' });
    }
    res.status(500).json({ error: 'Error creating vehicle' });
  }
};

// Update vehicle
exports.updateVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const { placa, marca, modelo, tipo, cliente_id } = req.body;

    const result = await pool.query(
      'UPDATE vehiculos SET placa = $1, marca = $2, modelo = $3, tipo = $4, cliente_id = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [placa, marca, modelo, tipo, cliente_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Error updating vehicle' });
  }
};

// Delete vehicle
exports.deleteVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM vehiculos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully', vehiculo: result.rows[0] });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Error deleting vehicle' });
  }
};