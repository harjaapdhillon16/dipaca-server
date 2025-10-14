const pool = require('../config/database');
require('dotenv').config();

async function fixServiciosTable() {
  const client = await pool.connect();
  
  try {
    console.log('Starting servicios table migration...\n');

    await client.query('BEGIN');

    // 1. Add trabajador_id column
    console.log('1. Checking trabajador_id column...');
    const trabajadorCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'servicios' AND column_name = 'trabajador_id'
    `);

    if (trabajadorCheck.rows.length === 0) {
      console.log('   Adding trabajador_id column...');
      await client.query(`
        ALTER TABLE servicios 
        ADD COLUMN trabajador_id INTEGER
      `);
      console.log('   ✅ trabajador_id column added');
    } else {
      console.log('   ✅ trabajador_id column already exists');
    }

    // 2. Add foreign key constraint for trabajador_id
    console.log('2. Adding foreign key constraint for trabajador_id...');
    const fkCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'servicios' 
      AND constraint_name = 'fk_servicios_trabajador'
    `);

    if (fkCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE servicios 
        ADD CONSTRAINT fk_servicios_trabajador 
        FOREIGN KEY (trabajador_id) 
        REFERENCES trabajadores(id) 
        ON DELETE SET NULL
      `);
      console.log('   ✅ Foreign key constraint added');
    } else {
      console.log('   ✅ Foreign key constraint already exists');
    }

    // 3. Add descripcion column
    console.log('3. Checking descripcion column...');
    const descripcionCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'servicios' AND column_name = 'descripcion'
    `);

    if (descripcionCheck.rows.length === 0) {
      console.log('   Adding descripcion column...');
      await client.query(`
        ALTER TABLE servicios 
        ADD COLUMN descripcion TEXT
      `);
      console.log('   ✅ descripcion column added');
    } else {
      console.log('   ✅ descripcion column already exists');
    }

    // 4. Create indexes for performance
    console.log('4. Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_servicios_trabajador 
      ON servicios(trabajador_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_servicios_fecha 
      ON servicios(fecha)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_servicios_status 
      ON servicios(status)
    `);
    console.log('   ✅ Indexes created');

    // 5. Add servicios_realizados to trabajadores if missing
    console.log('5. Checking servicios_realizados in trabajadores...');
    const serviciosRealizadosCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trabajadores' AND column_name = 'servicios_realizados'
    `);

    if (serviciosRealizadosCheck.rows.length === 0) {
      console.log('   Adding servicios_realizados column to trabajadores...');
      await client.query(`
        ALTER TABLE trabajadores 
        ADD COLUMN servicios_realizados INTEGER DEFAULT 0
      `);
      console.log('   ✅ servicios_realizados column added');
    } else {
      console.log('   ✅ servicios_realizados column already exists');
    }

    // 6. Update existing trabajadores with their service counts
    console.log('6. Updating servicios_realizados counts...');
    await client.query(`
      UPDATE trabajadores t
      SET servicios_realizados = (
        SELECT COUNT(*) 
        FROM servicios s 
        WHERE s.trabajador_id = t.id AND s.status = 'FINALIZADO'
      )
    `);
    console.log('   ✅ Service counts updated');

    await client.query('COMMIT');
    
    console.log('\n✅ Migration completed successfully!\n');

    // Display final table structure
    console.log('📋 Final servicios table structure:');
    const columns = await client.query(`
      SELECT 
        column_name, 
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'servicios'
      ORDER BY ordinal_position
    `);
    console.table(columns.rows);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixServiciosTable()
  .then(() => {
    console.log('\n🎉 All done! Restart your server now.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });