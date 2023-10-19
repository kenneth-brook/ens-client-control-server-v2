require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

app.use(bodyParser.json());

app.get('/client-control-host/clients', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients');
        res.json(result.rows);
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/client-control-host/clients/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Not Found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/client-control-host/clients', async (req, res) => {
    const data = req.body;
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    try {
        const result = await pool.query(
            `INSERT INTO clients(${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/client-control-host/clients/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const updates = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');

    try {
        const result = await pool.query(
            `UPDATE clients SET ${updates} WHERE id = $${Object.keys(data).length + 1} RETURNING *`,
            [...Object.values(data), id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Not Found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});