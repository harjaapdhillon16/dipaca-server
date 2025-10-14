const pool = require('../config/database');

// Get all clients
exports.getAllClientes = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM clientes';
    let params = [];

    if (search) {
      query += ' WHERE nombre ILIKE $1 OR apellido ILIKE $1 OR ci ILIKE $1 OR correo ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clientes:', error);
    res.status(500).json({ error: 'Error fetching clientes' });
  }
};

// Get single client
exports.getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching cliente:', error);
    res.status(500).json({ error: 'Error fetching cliente' });
  }
};

// Create client
exports.createCliente = async (req, res) => {
  try {
    const { ci, nombre, apellido, telefono, correo } = req.body;

    const result = await pool.query(
      'INSERT INTO clientes (ci, nombre, apellido, telefono, correo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [ci, nombre, apellido, telefono, correo]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating cliente:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'CI already exists' });
    }
    res.status(500).json({ error: 'Error creating cliente' });
  }
};

// Update client
exports.updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { ci, nombre, apellido, telefono, correo } = req.body;

    const result = await pool.query(
      'UPDATE clientes SET ci = $1, nombre = $2, apellido = $3, telefono = $4, correo = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [ci, nombre, apellido, telefono, correo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating cliente:', error);
    res.status(500).json({ error: 'Error updating cliente' });
  }
};

// Delete client
exports.deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente not found' });
    }

    res.json({ message: 'Cliente deleted successfully', cliente: result.rows[0] });
  } catch (error) {
    console.error('Error deleting cliente:', error);
    res.status(500).json({ error: 'Error deleting cliente' });
  }
};

// Get client stats
exports.getClienteStats = async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as total FROM clientes');
    res.json({ total: parseInt(result.rows[0].total) });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching stats' });
  }
};