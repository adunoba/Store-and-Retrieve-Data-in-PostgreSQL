// server.js
// This file sets up a basic Express.js API that connects to a PostgreSQL database
// and provides CRUD (Create, Read, Update, Delete) operations for 'items'.

// Import necessary modules
const express = require('express');
const { Pool } = require('pg'); // PostgreSQL client for Node.js

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000; // Define the port, default to 3000

// Middleware to parse JSON request bodies
app.use(express.json());

// --- PostgreSQL Database Configuration ---
// It's highly recommended to use environment variables for sensitive information
// like database credentials. For demonstration, they are hardcoded here.
// In a production environment, you would use:
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });
const pool = new Pool({
  user: 'spacedon',       // Replace with your PostgreSQL username
  host: 'localhost',          // Replace with your PostgreSQL host (e.g., 'localhost' or IP)
  database: 'spacedon', // Replace with your PostgreSQL database name
  password: 'akebaje', // Replace with your PostgreSQL password
  port: 5432,                 // Default PostgreSQL port
});

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release(); // Release the client back to the pool
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Successfully connected to PostgreSQL:', result.rows[0].now);
  });
});

// --- API Routes ---

// GET all items
// Endpoint: /api/items
app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching items:', err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// GET a single item by ID
// Endpoint: /api/items/:id
app.get('/api/items/:id', async (req, res) => {
  const { id } = req.params; // Extract ID from URL parameters
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching item with ID ${id}:`, err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// POST a new item
// Endpoint: /api/items
// Request Body: { "name": "string", "description": "string" }
app.post('/api/items', async (req, res) => {
  const { name, description } = req.body; // Extract name and description from request body

  // Basic validation
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]); // Return the newly created item
  } catch (err) {
    console.error('Error creating item:', err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// PUT (Update) an existing item by ID
// Endpoint: /api/items/:id
// Request Body: { "name": "string", "description": "string" }
app.put('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  // Basic validation
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required for update' });
  }

  try {
    const result = await pool.query(
      'UPDATE items SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(result.rows[0]); // Return the updated item
  } catch (err) {
    console.error(`Error updating item with ID ${id}:`, err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// DELETE an item by ID
// Endpoint: /api/items/:id
app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(204).send(); // 204 No Content for successful deletion
  } catch (err) {
    console.error(`Error deleting item with ID ${id}:`, err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('To stop the server, press Ctrl+C');
});