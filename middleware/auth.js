const jwt = require('jsonwebtoken');

// Verify JWT token
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains: { id, email, rol, cliente_id }
    console.log('🔐 Auth middleware - User:', req.user); // DEBUG
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Check if user is cliente
const isCliente = (req, res, next) => {
  if (req.user.rol !== 'cliente') {
    return res.status(403).json({ error: 'Access denied. Client only.' });
  }
  next();
};

// Allow both admin and cliente
const isAuthenticated = authMiddleware;

// Allow both admin and cliente
const isAdminOrCliente = (req, res, next) => {
  if (!['admin', 'cliente'].includes(req.user.rol)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  next();
};

// Check if user is accessing their own data
const isOwnerOrAdmin = (req, res, next) => {
  const requestedId = req.params.id;
  
  // Admin can access anything
  if (req.user.rol === 'admin') {
    return next();
  }
  
  // Cliente can only access their own data
  if (req.user.rol === 'cliente' && req.user.cliente_id == requestedId) {
    return next();
  }
  
  return res.status(403).json({ error: 'Access denied. You can only access your own data.' });
};

module.exports = {
  authMiddleware,
  isAdmin,
  isCliente,
  isAuthenticated,
  isOwnerOrAdmin,
  isAdminOrCliente // ADD THIS
};