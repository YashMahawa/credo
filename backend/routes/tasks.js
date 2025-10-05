const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware');
const router = express.Router();

// Get all open tasks
router.get('/', authenticateToken, async (req, res) => {
    try {
        // We join with the users table to get the giver's username and rating
        const tasks = await db.query(
            `SELECT t.*, u.username as giver_username, u.giving_rating 
             FROM tasks t
             JOIN users u ON t.giver_id = u.user_id
             WHERE t.status = 'OPEN' 
             ORDER BY t.created_at DESC`
        );
        res.json(tasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a new task
router.post('/', authenticateToken, async (req, res) => {
    const { title, description, reward, deadline } = req.body;
    const giver_id = req.user.id; // Reverted to access id directly

    try {
        const result = await db.run(
            "INSERT INTO tasks (giver_id, title, description, reward, deadline) VALUES (?, ?, ?, ?, ?)",
            [giver_id, title, description, reward, deadline]
        );
        const newTask = await db.query("SELECT * FROM tasks WHERE task_id = ?", [result.lastID]);
        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
