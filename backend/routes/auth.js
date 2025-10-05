const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    const { username, password, phone_number, roll_number } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            "INSERT INTO users (username, password_hash, phone_number, roll_number) VALUES (?, ?, ?, ?)",
            [username, hashedPassword, phone_number, roll_number]
        );
        res.status(201).json({ user_id: result.lastID, username });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Login a user
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.query("SELECT * FROM users WHERE username = ?", [username]);
        if (user.rows.length === 0) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const payload = {
            id: user.rows[0].user_id,
            username: user.rows[0].username
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
