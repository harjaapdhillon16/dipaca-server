const pool = require('../config/database');

// Get client dashboard data
exports.getClientDashboard = async (req, res) => {
  try {
    const clienteId = req.user.cliente_id;

    if (!clienteId) {
      return res.status(403).json({ error: 'User is not associated with a cliente' });
    }

    // Get cliente info
    const clienteResult = await pool.query(
      'SELECT * FROM clientes WHERE id = $1',
      [clienteId]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente not found' });
    }

    const cliente = clienteResult.rows[0];

    // Get cliente's vehicles
    const vehiculosResult = await pool.query(
      'SELECT * FROM vehiculos WHERE cliente_id = $1 ORDER BY created_at DESC',
      [clienteId]
    );

    // Get recent services
    const serviciosResult = await pool.query(
      `SELECT s.*, v.placa, v.marca, v.modelo 
       FROM servicios s
       LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
       WHERE s.cliente_id = $1 
       ORDER BY s.fecha DESC, s.created_at DESC
       LIMIT 10`,
      [clienteId]
    );

    // Get service statistics
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_servicios,
        SUM(monto) as total_gastado,
        COUNT(CASE WHEN status = 'FINALIZADO' THEN 1 END) as servicios_completados
       FROM servicios 
       WHERE cliente_id = $1`,
      [clienteId]
    );

    res.json({
      cliente: cliente,
      vehiculos: vehiculosResult.rows,
      servicios: serviciosResult.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
};

// Get cliente's active services
exports.getMyActiveServices = async (req, res) => {
  try {
    const clienteId = req.user.cliente_id;

    if (!clienteId) {
      return res.status(403).json({ error: 'User is not associated with a cliente' });
    }

    const { turno, limit = 50 } = req.query;

    let query = `
      SELECT s.*, v.placa, v.marca, v.modelo, v.tipo,
             c.nombre as cliente_nombre, c.apellido as cliente_apellido
      FROM servicios s
      LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
      LEFT JOIN clientes c ON s.cliente_id = c.id
      WHERE s.cliente_id = $1 
        AND s.status NOT IN ('FINALIZADO', 'CANCELADO')
    `;
    const params = [clienteId];
    let paramCount = 2;

    // Filter by date based on turno
    if (turno === 'Today') {
      query += ` AND DATE(s.fecha) = CURRENT_DATE`;
    } else if (turno === 'Tomorrow') {
      query += ` AND DATE(s.fecha) = CURRENT_DATE + INTERVAL '1 day'`;
    } else if (turno === 'This Week') {
      query += ` AND s.fecha >= CURRENT_DATE AND s.fecha < CURRENT_DATE + INTERVAL '7 days'`;
    }

    query += ` ORDER BY s.fecha DESC, s.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching active services:', error);
    res.status(500).json({ error: 'Error fetching active services' });
  }
};

// Get cliente's own information
exports.getMyInfo = async (req, res) => {
  try {
    const clienteId = req.user.cliente_id;

    if (!clienteId) {
      return res.status(403).json({ error: 'User is not associated with a cliente' });
    }

    const result = await pool.query(
      'SELECT * FROM clientes WHERE id = $1',
      [clienteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching info:', error);
    res.status(500).json({ error: 'Error fetching information' });
  }
};

// Get cliente's services
exports.getMyServices = async (req, res) => {
  try {
    const clienteId = req.user.cliente_id;

    if (!clienteId) {
      return res.status(403).json({ error: 'User is not associated with a cliente' });
    }

    const { status, limit = 50 } = req.query;

    let query = `
      SELECT s.*, v.placa, v.marca, v.modelo, v.tipo
      FROM servicios s
      LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
      WHERE s.cliente_id = $1
    `;
    const params = [clienteId];

    if (status) {
      query += ` AND s.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY s.fecha DESC, s.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Error fetching services' });
  }
};

// Get cliente's vehicles
exports.getMyVehicles = async (req, res) => {
  try {
    const clienteId = req.user.cliente_id;

    if (!clienteId) {
      return res.status(403).json({ error: 'User is not associated with a cliente' });
    }

    const result = await pool.query(
      'SELECT * FROM vehiculos WHERE cliente_id = $1 ORDER BY created_at DESC',
      [clienteId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Error fetching vehicles' });
  }
};

// Update own profile
exports.updateMyProfile = async (req, res) => {
  try {
    const clienteId = req.user.cliente_id;

    if (!clienteId) {
      return res.status(403).json({ error: 'User is not associated with a cliente' });
    }

    const { telefono, correo } = req.body;

    const result = await pool.query(
      'UPDATE clientes SET telefono = $1, correo = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [telefono, correo, clienteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
};

module.exports = exports;