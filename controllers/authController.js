const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token with role information
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rol: user.rol,
        cliente_id: user.cliente_id || null
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // If user is a cliente, get their cliente information
    let clienteInfo = null;
    if (user.rol === 'cliente' && user.cliente_id) {
      const clienteResult = await pool.query(
        'SELECT id, ci, nombre, apellido, telefono, correo FROM clientes WHERE id = $1',
        [user.cliente_id]
      );
      if (clienteResult.rows.length > 0) {
        clienteInfo = clienteResult.rows[0];
      }
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        cliente_id: user.cliente_id,
        clienteInfo: clienteInfo
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
};

// Register cliente (public endpoint)
exports.registerCliente = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { 
      email, 
      password, 
      ci, 
      nombre, 
      apellido, 
      telefono, 
      correo 
    } = req.body;

    // Check if user exists
    const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check if cliente with CI exists
    const existingCliente = await client.query('SELECT * FROM clientes WHERE ci = $1', [ci]);
    if (existingCliente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'CI already exists' });
    }

    // Create cliente
    const clienteResult = await client.query(
      'INSERT INTO clientes (ci, nombre, apellido, telefono, correo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [ci, nombre, apellido, telefono, correo || email]
    );

    const clienteId = clienteResult.rows[0].id;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account linked to cliente
    const userResult = await client.query(
      'INSERT INTO users (email, password, nombre, rol, cliente_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nombre, rol, cliente_id',
      [email, hashedPassword, `${nombre} ${apellido}`, 'cliente', clienteId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Cliente account created successfully',
      user: userResult.rows[0],
      cliente: clienteResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering cliente:', error);
    res.status(500).json({ error: 'Error registering cliente' });
  } finally {
    client.release();
  }
};

// Register admin (protected endpoint - admin only)
exports.registerAdmin = async (req, res) => {
  try {
    const { email, password, nombre } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const result = await pool.query(
      'INSERT INTO users (email, password, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id, email, nombre, rol',
      [email, hashedPassword, nombre, 'admin']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ error: 'Error registering admin' });
  }
};

// Verify token
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT id, email, nombre, rol, cliente_id FROM users WHERE id = $1', 
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = result.rows[0];

    // If user is a cliente, get their cliente information
    let clienteInfo = null;
    if (user.rol === 'cliente' && user.cliente_id) {
      const clienteResult = await pool.query(
        'SELECT id, ci, nombre, apellido, telefono, correo FROM clientes WHERE id = $1',
        [user.cliente_id]
      );
      if (clienteResult.rows.length > 0) {
        clienteInfo = clienteResult.rows[0];
      }
    }

    res.json({ 
      user: {
        ...user,
        clienteInfo
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};