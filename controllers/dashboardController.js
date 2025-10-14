const pool = require('../config/database');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, year

    let dateFilter = '';
    switch(period) {
      case 'week':
        dateFilter = "fecha >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "fecha >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "fecha >= CURRENT_DATE - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "fecha >= CURRENT_DATE - INTERVAL '7 days'";
    }

    // Total income
    const incomeResult = await pool.query(`
      SELECT 
        COALESCE(SUM(monto), 0) as total_ingresos,
        COUNT(*) as total_servicios
      FROM servicios 
      WHERE status = 'FINALIZADO' AND ${dateFilter}
    `);

    // Tips (assuming 10% of total is tips - adjust as needed)
    const propinas = (incomeResult.rows[0].total_ingresos * 0.1).toFixed(2);

    res.json({
      total_ingresos: parseFloat(incomeResult.rows[0].total_ingresos).toFixed(2),
      propinas: parseFloat(propinas),
      total_servicios: parseInt(incomeResult.rows[0].total_servicios),
      period
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Error fetching dashboard stats' });
  }
};

// Get monthly income chart data
exports.getMonthlyIncome = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(fecha, 'Mon') as month,
        EXTRACT(MONTH FROM fecha) as month_num,
        SUM(monto) as total
      FROM servicios
      WHERE status = 'FINALIZADO' 
        AND fecha >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(fecha, 'Mon'), EXTRACT(MONTH FROM fecha)
      ORDER BY month_num ASC
    `);

    res.json(result.rows.map(row => ({
      name: row.month.toUpperCase(),
      value: parseFloat(row.total)
    })));
  } catch (error) {
    console.error('Error fetching monthly income:', error);
    res.status(500).json({ error: 'Error fetching monthly income' });
  }
};

// Get worker ranking
exports.getWorkerRanking = async (req, res) => {
  try {
    const { period = 'month', limit = 10 } = req.query;

    let dateFilter = '';
    switch(period) {
      case 'week':
        dateFilter = "AND s.fecha >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND s.fecha >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND s.fecha >= CURRENT_DATE - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "AND s.fecha >= CURRENT_DATE - INTERVAL '30 days'";
    }

    const result = await pool.query(`
      SELECT 
        t.id,
        t.nombre,
        t.apellido,
        COUNT(s.id) as servicios_count
      FROM trabajadores t
      LEFT JOIN servicios s ON t.id = s.trabajador_id AND s.status = 'FINALIZADO' ${dateFilter}
      GROUP BY t.id, t.nombre, t.apellido
      HAVING COUNT(s.id) > 0
      ORDER BY servicios_count DESC
      LIMIT $1
    `, [limit]);

    res.json(result.rows.map(row => ({
      nombre: `${row.nombre} ${row.apellido}`,
      servicios: parseInt(row.servicios_count)
    })));
  } catch (error) {
    console.error('Error fetching worker ranking:', error);
    res.status(500).json({ error: 'Error fetching worker ranking' });
  }
};

// Get income by service type
exports.getIncomeByService = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch(period) {
      case 'week':
        dateFilter = "AND fecha >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND fecha >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND fecha >= CURRENT_DATE - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "AND fecha >= CURRENT_DATE - INTERVAL '30 days'";
    }

    const result = await pool.query(`
      SELECT 
        tipo_servicio as name,
        SUM(monto) as value
      FROM servicios
      WHERE status = 'FINALIZADO' ${dateFilter}
      GROUP BY tipo_servicio
      ORDER BY value DESC
    `);

    // Assign colors
    const colors = ['#0f4c81', '#5ba3d0', '#a8d5f2', '#4ade80', '#f59e0b'];
    
    res.json(result.rows.map((row, index) => ({
      name: row.name,
      value: parseFloat(row.value),
      color: colors[index % colors.length]
    })));
  } catch (error) {
    console.error('Error fetching income by service:', error);
    res.status(500).json({ error: 'Error fetching income by service' });
  }
};

// Get income by payment method
exports.getIncomeByPayment = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch(period) {
      case 'week':
        dateFilter = "AND fecha >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND fecha >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND fecha >= CURRENT_DATE - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "AND fecha >= CURRENT_DATE - INTERVAL '30 days'";
    }

    const result = await pool.query(`
      SELECT 
        COALESCE(metodo_pago, 'EFECTIVO') as name,
        SUM(monto) as value
      FROM servicios
      WHERE status = 'FINALIZADO' ${dateFilter}
      GROUP BY COALESCE(metodo_pago, 'EFECTIVO')
      ORDER BY value DESC
    `);

    res.json(result.rows.map(row => ({
      name: row.name,
      value: parseFloat(row.value)
    })));
  } catch (error) {
    console.error('Error fetching income by payment:', error);
    res.status(500).json({ error: 'Error fetching income by payment' });
  }
};

module.exports = exports;