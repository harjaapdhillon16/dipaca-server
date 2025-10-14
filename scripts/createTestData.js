const pool = require('../config/database');
require('dotenv').config();

async function createTestData() {
  try {
    console.log('Creating test data...');

    // Create a test cliente
    const clienteResult = await pool.query(`
      INSERT INTO clientes (ci, nombre, apellido, telefono, correo)
      VALUES ('12345678', 'Marco', 'Cobo', '04123456789', 'marco@test.com')
      ON CONFLICT (ci) DO UPDATE SET nombre = EXCLUDED.nombre
      RETURNING id
    `);
    const clienteId = clienteResult.rows[0].id;
    console.log('✅ Cliente created/updated with ID:', clienteId);

    // Create a test trabajador
    const trabajadorResult = await pool.query(`
      INSERT INTO trabajadores (ci, nombre, apellido, telefono, correo, cargo, servicios_realizados)
      VALUES ('87654321', 'Jose', 'Nieves', '04129876543', 'jose@test.com', 'Mecánico', 0)
      ON CONFLICT (ci) DO UPDATE SET nombre = EXCLUDED.nombre
      RETURNING id
    `);
    const trabajadorId = trabajadorResult.rows[0].id;
    console.log('✅ Trabajador created/updated with ID:', trabajadorId);

    // Create a second trabajador
    const trabajador2Result = await pool.query(`
      INSERT INTO trabajadores (ci, nombre, apellido, telefono, correo, cargo, servicios_realizados)
      VALUES ('11223344', 'Antonio', 'Lehmua', '04141234567', 'antonio@test.com', 'Lavador', 0)
      ON CONFLICT (ci) DO UPDATE SET nombre = EXCLUDED.nombre
      RETURNING id
    `);
    const trabajador2Id = trabajador2Result.rows[0].id;
    console.log('✅ Second trabajador created/updated with ID:', trabajador2Id);

    // Create a test vehiculo
    const vehiculoResult = await pool.query(`
      INSERT INTO vehiculos (placa, marca, modelo, tipo, cliente_id)
      VALUES ('ABC123', 'Ford', 'Fusion', 'Sedan', $1)
      ON CONFLICT (placa) DO UPDATE SET marca = EXCLUDED.marca
      RETURNING id
    `, [clienteId]);
    const vehiculoId = vehiculoResult.rows[0].id;
    console.log('✅ Vehiculo created/updated with ID:', vehiculoId);

    // Create test servicios with trabajador_id
    const servicioResult = await pool.query(`
      INSERT INTO servicios (
        cliente_id, vehiculo_id, trabajador_id, 
        tipo_servicio, descripcion, monto, fecha, 
        status, cancelado, metodo_pago, 
        hora_entrada, hora_salida
      )
      VALUES 
        ($1, $2, $3, 'FULL', 'Lavado completo', 20, CURRENT_DATE, 'FINALIZADO', false, 'EFECTIVO', '09:00:00', '10:30:00'),
        ($1, $2, $3, 'BÁSICO', 'Lavado básico', 15, CURRENT_DATE, 'EN_PROCESO', false, 'EFECTIVO', '11:00:00', NULL),
        ($1, $2, $4, 'PREMIUM', 'Lavado premium con encerado', 35, CURRENT_DATE - INTERVAL '1 day', 'FINALIZADO', false, 'TARJETA', '14:00:00', '16:00:00'),
        ($1, $2, $3, 'FULL', 'Lavado completo', 20, CURRENT_DATE - INTERVAL '2 days', 'FINALIZADO', false, 'PAGO_MOVIL', '10:00:00', '11:30:00'),
        ($1, $2, $4, 'BÁSICO', 'Lavado exterior', 12, CURRENT_DATE - INTERVAL '3 days', 'FINALIZADO', false, 'EFECTIVO', '15:00:00', '15:45:00'),
        ($1, $2, $3, 'FULL', 'Lavado completo con aspirado', 25, CURRENT_DATE - INTERVAL '1 week', 'FINALIZADO', false, 'ZELLE', '09:00:00', '11:00:00'),
        ($1, $2, $4, 'PREMIUM', 'Lavado premium', 40, CURRENT_DATE - INTERVAL '2 weeks', 'FINALIZADO', false, 'BINANCE', '13:00:00', '15:30:00')
      RETURNING id
    `, [clienteId, vehiculoId, trabajadorId, trabajador2Id]);

    console.log('✅ Servicios created with IDs:', servicioResult.rows.map(r => r.id));

    // Update trabajadores servicios_realizados count
    await pool.query(`
      UPDATE trabajadores t
      SET servicios_realizados = (
        SELECT COUNT(*) 
        FROM servicios s 
        WHERE s.trabajador_id = t.id AND s.status = 'FINALIZADO'
      )
    `);
    console.log('✅ Trabajadores service counts updated');

    // Create test todos for first servicio
    const firstServicioId = servicioResult.rows[0].id;
    await pool.query(`
      INSERT INTO todos (servicio_id, text, done)
      VALUES 
        ($1, 'Confirmar pago', true),
        ($1, 'Verificar limpieza interior', true),
        ($1, 'Revisar neumáticos', false)
      ON CONFLICT DO NOTHING
    `, [firstServicioId]);

    console.log('✅ Todos created for servicio ID:', firstServicioId);
    console.log('\n📝 Test data created successfully!');
    console.log(`🔗 Visit dashboard: http://localhost:3000/home`);
    console.log(`🔗 Visit servicio: http://localhost:3000/servicios/todos/${firstServicioId}`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    await pool.end();
    process.exit(1);
  }
}

createTestData();