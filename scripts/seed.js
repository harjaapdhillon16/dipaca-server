const bcrypt = require('bcrypt');
const pool = require('../config/database');
require('dotenv').config();

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (email, password, nombre, rol) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      ['admin@dipaca.com', adminPassword, 'Admin User', 'admin']
    );
    console.log('✅ Admin user created (email: admin@dipaca.com, password: admin123)\n');

    // 2. Create sample clientes
    console.log('Creating sample clientes...');
    const clientes = [
      { ci: '27456223', nombre: 'MARCO', apellido: 'COBO', telefono: '04123452904', correo: 'marcocobo@gmail.com' },
      { ci: '30998763', nombre: 'JOSE', apellido: 'NIEVES', telefono: '04245679872', correo: 'Josenieves25@gmail.com' },
      { ci: '23445012', nombre: 'FELIX', apellido: 'DIAZ', telefono: '04162342342', correo: 'FelixDiezoo@gmail.com' },
      { ci: '8907632', nombre: 'LEONARDO', apellido: 'SANTANA', telefono: '04261112230', correo: 'Leosantana@gmail.com' },
    ];

    const clienteIds = [];
    for (const cliente of clientes) {
      const result = await pool.query(
        `INSERT INTO clientes (ci, nombre, apellido, telefono, correo) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (ci) DO UPDATE SET 
         nombre = EXCLUDED.nombre,
         apellido = EXCLUDED.apellido,
         telefono = EXCLUDED.telefono,
         correo = EXCLUDED.correo
         RETURNING id`,
        [cliente.ci, cliente.nombre, cliente.apellido, cliente.telefono, cliente.correo]
      );
      clienteIds.push(result.rows[0].id);
    }
    console.log(`✅ ${clientes.length} clientes created\n`);

    // 3. Create cliente user accounts
    console.log('Creating cliente user accounts...');
    const clientePassword = await bcrypt.hash('cliente123', 10);
    for (let i = 0; i < clientes.length; i++) {
      const cliente = clientes[i];
      const clienteId = clienteIds[i];
      await pool.query(
        `INSERT INTO users (email, password, nombre, rol, cliente_id) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (email) DO NOTHING`,
        [cliente.correo, clientePassword, `${cliente.nombre} ${cliente.apellido}`, 'cliente', clienteId]
      );
    }
    console.log(`✅ Cliente users created (password for all: cliente123)\n`);

    // 4. Create trabajadores
    console.log('Creating trabajadores...');
    const trabajadores = [
      { ci: '15234567', nombre: 'CARLOS', apellido: 'LOPEZ', telefono: '04129876543', correo: 'carlos@dipaca.com', cargo: 'Lavador' },
      { ci: '18765432', nombre: 'ANA', apellido: 'MARTINEZ', telefono: '04249876543', correo: 'ana@dipaca.com', cargo: 'Cajero' },
      { ci: '12345098', nombre: 'PEDRO', apellido: 'RODRIGUEZ', telefono: '04261234567', correo: 'pedro@dipaca.com', cargo: 'Supervisor' },
    ];

    const trabajadorIds = [];
    for (const trabajador of trabajadores) {
      const result = await pool.query(
        `INSERT INTO trabajadores (ci, nombre, apellido, telefono, correo, cargo) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (ci) DO UPDATE SET 
         nombre = EXCLUDED.nombre,
         cargo = EXCLUDED.cargo
         RETURNING id`,
        [trabajador.ci, trabajador.nombre, trabajador.apellido, trabajador.telefono, trabajador.correo, trabajador.cargo]
      );
      trabajadorIds.push(result.rows[0].id);
    }
    console.log(`✅ ${trabajadores.length} trabajadores created\n`);

    // 5. Create vehiculos
    console.log('Creating vehiculos...');
    const vehiculos = [
      { placa: 'AGK345P', marca: 'FORD', modelo: 'FUSION', tipo: 'Sedan', cliente_id: clienteIds[0] },
      { placa: 'JJK340E', marca: 'FORD', modelo: 'FUSION', tipo: 'Sedan', cliente_id: clienteIds[1] },
      { placa: '3INMD2Q', marca: 'FORD', modelo: 'FIESTA', tipo: 'Hatchback', cliente_id: clienteIds[2] },
      { placa: 'BYT3535', marca: 'FORD', modelo: 'EXPLORER', tipo: 'SUV', cliente_id: clienteIds[3] },
    ];

    const vehiculoIds = [];
    for (const vehiculo of vehiculos) {
      const result = await pool.query(
        `INSERT INTO vehiculos (placa, marca, modelo, tipo, cliente_id) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (placa) DO UPDATE SET 
         marca = EXCLUDED.marca,
         modelo = EXCLUDED.modelo
         RETURNING id`,
        [vehiculo.placa, vehiculo.marca, vehiculo.modelo, vehiculo.tipo, vehiculo.cliente_id]
      );
      vehiculoIds.push(result.rows[0].id);
    }
    console.log(`✅ ${vehiculos.length} vehiculos created\n`);

    // 6. Create servicios
    console.log('Creating servicios...');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const servicios = [
      {
        fecha: today,
        hora_entrada: '09:00:00',
        hora_salida: '09:30:00',
        placa: 'AGK345P',
        vehiculo_id: vehiculoIds[0],
        cliente_id: clienteIds[0],
        tipo_servicio: 'FULL',
        monto: 20,
        metodo_pago: 'EFECTIVO',
        status: 'LAVADO',
        cancelado: false
      },
      {
        fecha: today,
        hora_entrada: '10:00:00',
        hora_salida: '10:30:00',
        placa: 'JJK340E',
        vehiculo_id: vehiculoIds[1],
        cliente_id: clienteIds[1],
        tipo_servicio: 'FULL',
        monto: 20,
        metodo_pago: 'TARJETA',
        status: 'ASPIRADO',
        cancelado: true
      },
      {
        fecha: yesterday,
        hora_entrada: '14:00:00',
        hora_salida: '14:30:00',
        placa: '3INMD2Q',
        vehiculo_id: vehiculoIds[2],
        cliente_id: clienteIds[2],
        tipo_servicio: 'FULL',
        monto: 20,
        metodo_pago: 'EFECTIVO',
        status: 'FINALIZADO',
        cancelado: false
      },
      {
        fecha: yesterday,
        hora_entrada: '15:00:00',
        hora_salida: '15:45:00',
        placa: 'BYT3535',
        vehiculo_id: vehiculoIds[3],
        cliente_id: clienteIds[3],
        tipo_servicio: 'FULL',
        monto: 25,
        metodo_pago: 'TRANSFERENCIA',
        status: 'FINALIZADO',
        cancelado: false
      },
    ];

    for (const servicio of servicios) {
      const result = await pool.query(
        `INSERT INTO servicios 
         (fecha, hora_entrada, hora_salida, placa, vehiculo_id, cliente_id, tipo_servicio, monto, metodo_pago, status, cancelado) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          servicio.fecha,
          servicio.hora_entrada,
          servicio.hora_salida,
          servicio.placa,
          servicio.vehiculo_id,
          servicio.cliente_id,
          servicio.tipo_servicio,
          servicio.monto,
          servicio.metodo_pago,
          servicio.status,
          servicio.cancelado
        ]
      );

      // Link trabajadores to servicio
      const servicioId = result.rows[0].id;
      await pool.query(
        `INSERT INTO servicio_trabajadores (servicio_id, trabajador_id) 
         VALUES ($1, $2), ($1, $3)
         ON CONFLICT DO NOTHING`,
        [servicioId, trabajadorIds[0], trabajadorIds[1]]
      );
    }
    console.log(`✅ ${servicios.length} servicios created\n`);

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - Admin user: admin@dipaca.com / admin123`);
    console.log(`   - ${clientes.length} cliente users (password: cliente123)`);
    console.log(`   - ${trabajadores.length} trabajadores`);
    console.log(`   - ${vehiculos.length} vehiculos`);
    console.log(`   - ${servicios.length} servicios\n`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

// Run the seed function
seed();