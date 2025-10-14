const pool = require('../config/database');

// Get all services
exports.getAllServicios = async (req, res) => {
  try {
    const { search, status, fecha } = req.query;
    let query = `
      SELECT s.*, 
        c.nombre || ' ' || c.apellido as cliente_nombre,
        v.marca, v.modelo, v.tipo
      FROM servicios s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (s.placa ILIKE $${paramCount} OR c.nombre ILIKE $${paramCount} OR c.apellido ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND s.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (fecha) {
      query += ` AND s.fecha = $${paramCount}`;
      params.push(fecha);
    }

    query += ' ORDER BY s.fecha DESC, s.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching servicios:', error);
    res.status(500).json({ error: 'Error fetching servicios' });
  }
};

// Get active services
exports.getActiveServicios = async (req, res) => {
  try {
    const query = `
      SELECT s.*, 
        c.nombre || ' ' || c.apellido as cliente_nombre,
        v.marca, v.modelo, v.tipo
      FROM servicios s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
      WHERE s.status != 'FINALIZADO'
      ORDER BY s.created_at DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching active services:', error);
    res.status(500).json({ error: 'Error fetching active services' });
  }
};

// Get completed services
exports.getCompletedServicios = async (req, res) => {
  try {
    const query = `
      SELECT s.*, 
        c.nombre || ' ' || c.apellido as cliente_nombre,
        v.marca, v.modelo, v.tipo
      FROM servicios s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
      WHERE s.status = 'FINALIZADO'
      ORDER BY s.fecha DESC
      LIMIT 50
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching completed services:', error);
    res.status(500).json({ error: 'Error fetching completed services' });
  }
};

// Get single service with todos
exports.getServicioById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const serviceQuery = `
      SELECT s.*, 
        c.*, 
        v.placa, v.marca, v.modelo, v.tipo,
        array_agg(DISTINCT t.nombre || ' ' || t.apellido) as trabajadores
      FROM servicios s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      LEFT JOIN vehiculos v ON s.vehiculo_id = v.id
      LEFT JOIN servicio_trabajadores st ON s.id = st.servicio_id
      LEFT JOIN trabajadores t ON st.trabajador_id = t.id
      WHERE s.id = $1
      GROUP BY s.id, c.id, v.id
    `;

    const serviceResult = await pool.query(serviceQuery, [id]);
    
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Get todos for this service
    const todosResult = await pool.query(
      'SELECT * FROM todos WHERE servicio_id = $1 ORDER BY created_at',
      [id]
    );

    const service = serviceResult.rows[0];
    service.todos = todosResult.rows;

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Error fetching service' });
  }
};

// Create service
exports.createServicio = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      fecha,
      hora_entrada,
      hora_salida,
      placa,
      vehiculo_id,
      cliente_id,
      tipo_servicio,
      monto,
      metodo_pago,
      status,
      trabajadores,
      todos
    } = req.body;

    // Insert service
    const serviceResult = await client.query(
      `INSERT INTO servicios 
        (fecha, hora_entrada, hora_salida, placa, vehiculo_id, cliente_id, tipo_servicio, monto, metodo_pago, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [fecha, hora_entrada, hora_salida, placa, vehiculo_id, cliente_id, tipo_servicio, monto, metodo_pago, status || 'PENDIENTE']
    );

    const servicioId = serviceResult.rows[0].id;

    // Link trabajadores
    if (trabajadores && trabajadores.length > 0) {
      for (const trabajadorId of trabajadores) {
        await client.query(
          'INSERT INTO servicio_trabajadores (servicio_id, trabajador_id) VALUES ($1, $2)',
          [servicioId, trabajadorId]
        );
      }
    }

    // Create todos
    if (todos && todos.length > 0) {
      for (const todo of todos) {
        await client.query(
          'INSERT INTO todos (servicio_id, text, done) VALUES ($1, $2, $3)',
          [servicioId, todo.text, todo.done || false]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(serviceResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Error creating service' });
  } finally {
    client.release();
  }
};

// Update service
exports.updateServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha,
      hora_entrada,
      hora_salida,
      tipo_servicio,
      monto,
      metodo_pago,
      status,
      cancelado
    } = req.body;

    const result = await pool.query(
      `UPDATE servicios 
       SET fecha = $1, hora_entrada = $2, hora_salida = $3, tipo_servicio = $4, 
           monto = $5, metodo_pago = $6, status = $7, cancelado = $8, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9 
       RETURNING *`,
      [fecha, hora_entrada, hora_salida, tipo_servicio, monto, metodo_pago, status, cancelado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Error updating service' });
  }
};

// Update service status
exports.updateServicioStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE servicios SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Error updating status' });
  }
};

// Delete service
exports.deleteServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM servicios WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ message: 'Service deleted successfully', servicio: result.rows[0] });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Error deleting service' });
  }
};

// Get service stats
exports.getServicioStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      'SELECT COUNT(*) as total FROM servicios WHERE fecha = $1',
      [today]
    );
    res.json({ entradas: parseInt(result.rows[0].total) });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching stats' });
  }
};