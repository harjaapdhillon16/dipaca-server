const pool = require('../config/database');

// Get all todos for a servicio
exports.getTodosByServicio = async (req, res) => {
  try {
    const { servicio_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM todos WHERE servicio_id = $1 ORDER BY created_at ASC',
      [servicio_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Error fetching todos' });
  }
};

// Create todo
exports.createTodo = async (req, res) => {
  try {
    const { servicio_id } = req.params;
    const { text, done } = req.body;

    const result = await pool.query(
      'INSERT INTO todos (servicio_id, text, done) VALUES ($1, $2, $3) RETURNING *',
      [servicio_id, text, done || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Error creating todo' });
  }
};

// Update todo
exports.updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, done } = req.body;

    const result = await pool.query(
      'UPDATE todos SET text = $1, done = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [text, done, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Error updating todo' });
  }
};

// Toggle todo done status
exports.toggleTodo = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE todos SET done = NOT done, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ error: 'Error toggling todo' });
  }
};

// Delete todo
exports.deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully', todo: result.rows[0] });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Error deleting todo' });
  }
};

module.exports = exports;