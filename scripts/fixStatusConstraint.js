const pool = require('../config/database');
require('dotenv').config();

async function fixStatusConstraint() {
  try {
    console.log('Fixing status constraint...\n');

    // Drop existing check constraint
    console.log('1. Dropping old constraint...');
    await pool.query(`
      ALTER TABLE servicios 
      DROP CONSTRAINT IF EXISTS servicios_status_check
    `);
    console.log('   ✅ Old constraint dropped');

    // Add new constraint with all valid statuses
    console.log('2. Adding new constraint...');
    await pool.query(`
      ALTER TABLE servicios 
      ADD CONSTRAINT servicios_status_check 
      CHECK (status IN (
        'PENDIENTE',
        'EN_PROCESO', 
        'LAVADO',
        'ASPIRADO',
        'SECADO',
        'ENCERADO',
        'FINALIZADO',
        'CANCELADO'
      ))
    `);
    console.log('   ✅ New constraint added');

    console.log('\n✅ Status constraint fixed successfully!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

fixStatusConstraint();