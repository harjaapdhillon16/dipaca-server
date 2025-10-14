const pool = require('../config/database');
require('dotenv').config();

async function createServiceItemsTable() {
  try {
    console.log('Creating servicio_items table...\n');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS servicio_items (
        id SERIAL PRIMARY KEY,
        servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
        nombre VARCHAR(200) NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ servicio_items table created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_servicio_items_servicio 
      ON servicio_items(servicio_id);
    `);

    console.log('✅ Index created');

    // Create products catalog table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos_catalogo (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ productos_catalogo table created');

    // Insert default products
    await pool.query(`
      INSERT INTO productos_catalogo (nombre, precio) VALUES
        ('Lavado Exterior', 10),
        ('Aspirado', 10),
        ('Cera', 12),
        ('Shampoo', 15),
        ('Ambientador', 5),
        ('Aceite', 20),
        ('Pulido', 25),
        ('Encerado', 30)
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Default products inserted');

    // Add discount and tip columns to servicios if they don't exist
    await pool.query(`
      ALTER TABLE servicios 
      ADD COLUMN IF NOT EXISTS descuento DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS propina DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS puntos_usados INTEGER DEFAULT 0;
    `);

    console.log('✅ Discount and tip columns added to servicios');

    console.log('\n🎉 All tables created successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

createServiceItemsTable();