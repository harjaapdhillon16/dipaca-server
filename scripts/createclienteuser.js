const bcrypt = require('bcrypt');
const pool = require('../config/database');
require('dotenv').config();

async function createClienteUser() {
  const client = await pool.connect();
  
  try {
    console.log('Creating cliente user...\n');

    await client.query('BEGIN');

    // 1. Create a cliente
    const clienteResult = await client.query(`
      INSERT INTO clientes (ci, nombre, apellido, telefono, correo)
      VALUES ('12345678', 'Marco', 'Cobo', '04123456789', 'marco@cliente.com')
      ON CONFLICT (ci) DO UPDATE 
      SET correo = EXCLUDED.correo
      RETURNING id
    `);
    const clienteId = clienteResult.rows[0].id;
    console.log('✅ Cliente created/updated with ID:', clienteId);

    // 2. Check if user exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['marco@cliente.com']
    );

    let userId;
    if (existingUser.rows.length > 0) {
      // Update existing user
      console.log('User already exists, updating cliente_id...');
      await client.query(
        'UPDATE users SET cliente_id = $1, rol = $2 WHERE email = $3',
        [clienteId, 'cliente', 'marco@cliente.com']
      );
      userId = existingUser.rows[0].id;
      console.log('✅ User updated with cliente_id');
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash('cliente123', 10);
      const userResult = await client.query(
        'INSERT INTO users (email, password, nombre, rol, cliente_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['marco@cliente.com', hashedPassword, 'Marco Cobo', 'cliente', clienteId]
      );
      userId = userResult.rows[0].id;
      console.log('✅ User created');
    }

    // 3. Create a vehicle for this cliente
    await client.query(`
      INSERT INTO vehiculos (placa, marca, modelo, tipo, cliente_id)
      VALUES ('ABC123', 'Ford', 'Fusion', 'Sedan', $1)
      ON CONFLICT (placa) DO UPDATE 
      SET cliente_id = EXCLUDED.cliente_id
    `, [clienteId]);
    console.log('✅ Vehicle created/updated');

    // 4. Get the vehicle id
    const vehiculoResult = await client.query(
      'SELECT id FROM vehiculos WHERE placa = $1',
      ['ABC123']
    );
    const vehiculoId = vehiculoResult.rows[0].id;

    // 5. Create test services for this cliente with VALID status values
    await client.query(`
      INSERT INTO servicios (
        cliente_id, vehiculo_id, tipo_servicio, 
        descripcion, monto, fecha, status, 
        cancelado, metodo_pago, hora_entrada
      )
      VALUES 
        ($1, $2, 'FULL', 'Lavado completo', 20, CURRENT_DATE, 'EN_PROCESO', false, 'EFECTIVO', '09:00:00'),
        ($1, $2, 'BÁSICO', 'Lavado básico', 15, CURRENT_DATE, 'PENDIENTE', false, 'EFECTIVO', '10:00:00'),
        ($1, $2, 'PREMIUM', 'Lavado premium', 35, CURRENT_DATE + INTERVAL '1 day', 'PENDIENTE', false, 'TARJETA', '14:00:00')
      ON CONFLICT DO NOTHING
    `, [clienteId, vehiculoId]);
    console.log('✅ Test services created');

    await client.query('COMMIT');
    
    console.log('\n✅ Cliente user created successfully!');
    console.log('\n📝 Login credentials:');
    console.log('Email: marco@cliente.com');
    console.log('Password: cliente123');
    console.log('\n🔗 After login, visit: http://localhost:3000/client-dash');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createClienteUser()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });