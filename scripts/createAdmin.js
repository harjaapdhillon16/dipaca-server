const bcrypt = require('bcrypt');
const pool = require('../config/database');
require('dotenv').config();

async function createAdmin() {
  try {
    const email = process.argv[2] || 'client@dipaca.com';
    const password = process.argv[3] || 'client123';
    const nombre = process.argv[4] || 'Cliente';

    console.log(`Creating admin user...`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    // Check if admin exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('❌ User with this email already exists');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const result = await pool.query(
      'INSERT INTO users (email, password, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id, email, nombre, rol',
      [email, hashedPassword, nombre, 'admin']
    );

    console.log('✅ Admin user created successfully:');
    console.log(result.rows[0]);
    console.log('\n📝 Login credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();