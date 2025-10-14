const pool = require('../config/database');

// Get all trabajadores
exports.getAllTrabajadores = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM trabajadores';
    let params = [];

    if (search) {
      query += ' WHERE nombre ILIKE $1 OR apellido ILIKE $1 OR ci ILIKE $1 OR cargo ILIKE $1 OR correo ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trabajadores:', error);
    res.status(500).json({ error: 'Error fetching trabajadores' });
  }
};

// Get single trabajador
exports.getTrabajadorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM trabajadores WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching trabajador:', error);
    res.status(500).json({ error: 'Error fetching trabajador' });
  }
};

// Create trabajador
exports.createTrabajador = async (req, res) => {
  try {
    const { ci, nombre, apellido, telefono, correo, cargo } = req.body;

    const result = await pool.query(
      'INSERT INTO trabajadores (ci, nombre, apellido, telefono, correo, cargo, servicios_realizados) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [ci, nombre, apellido, telefono, correo, cargo, 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating trabajador:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'CI already exists' });
    }
    res.status(500).json({ error: 'Error creating trabajador' });
  }
};

// Update trabajador
exports.updateTrabajador = async (req, res) => {
  try {
    const { id } = req.params;
    const { ci, nombre, apellido, telefono, correo, cargo } = req.body;

    const result = await pool.query(
      'UPDATE trabajadores SET ci = $1, nombre = $2, apellido = $3, telefono = $4, correo = $5, cargo = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [ci, nombre, apellido, telefono, correo, cargo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trabajador:', error);
    res.status(500).json({ error: 'Error updating trabajador' });
  }
};

// Delete trabajador
exports.deleteTrabajador = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM trabajadores WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajador not found' });
    }

    res.json({ message: 'Trabajador deleted successfully', trabajador: result.rows[0] });
  } catch (error) {
    console.error('Error deleting trabajador:', error);
    res.status(500).json({ error: 'Error deleting trabajador' });
  }
};

// Get trabajador stats
exports.getTrabajadorStats = async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as total FROM trabajadores');
    res.json({ total: parseInt(result.rows[0].total) });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching stats' });
  }
};