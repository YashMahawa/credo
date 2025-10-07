const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    const { username, password, phone_number, roll_number } = req.body;
    try {
        // Check for existing username
        const existingUser = await db.query("SELECT * FROM users WHERE username = ?", [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ msg: "Username already exists" });
        }
        
        // Check for existing phone number
        const existingPhone = await db.query("SELECT * FROM users WHERE phone_number = ?", [phone_number]);
        if (existingPhone.rows.length > 0) {
            return res.status(400).json({ msg: "Phone number already registered" });
        }
        
        // Check for existing roll number
        const existingRoll = await db.query("SELECT * FROM users WHERE roll_number = ?", [roll_number]);
        if (existingRoll.rows.length > 0) {
            return res.status(400).json({ msg: "Roll number already registered" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            "INSERT INTO users (username, password_hash, phone_number, roll_number) VALUES (?, ?, ?, ?)",
            [username, hashedPassword, phone_number, roll_number]
        );
        res.status(201).json({ user_id: result.lastID, username });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server error" });
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
        res.status(500).json({ msg: "Server error" });
    }
});

// Get current user profile with stats
router.get('/profile', require('../middleware').authenticateToken, async (req, res) => {
    try {
        const user = await db.query(
            "SELECT user_id, username, phone_number, roll_number, giving_rating, accepting_rating, giving_rating_count, accepting_rating_count, trophies_given, trophies_accepted, created_at FROM users WHERE user_id = ?",
            [req.user.id]
        );
        if (user.rows.length === 0) {
            return res.status(404).json({ msg: "User not found" });
        }

        const tasksGiven = await db.query("SELECT COUNT(*) as count FROM tasks WHERE giver_id = ?", [req.user.id]);
        const tasksAccepted = await db.query("SELECT COUNT(*) as count FROM tasks WHERE acceptor_id = ?", [req.user.id]);
        const tasksCompleted = await db.query("SELECT COUNT(*) as count FROM tasks WHERE (giver_id = ? OR acceptor_id = ?) AND status = 'COMPLETED'", [req.user.id, req.user.id]);
        const applications = await db.query("SELECT COUNT(*) as count FROM task_applications WHERE applicant_id = ?", [req.user.id]);

        const userData = user.rows[0];
        res.json({
            ...userData,
            trophies_given: userData.trophies_given || 0,
            trophies_accepted: userData.trophies_accepted || 0,
            stats: {
                tasks_given: tasksGiven.rows[0].count,
                tasks_accepted: tasksAccepted.rows[0].count,
                tasks_completed: tasksCompleted.rows[0].count,
                applications: applications.rows[0].count
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Update user profile
router.put('/profile', require('../middleware').authenticateToken, async (req, res) => {
    try {
        const { phone_number, roll_number } = req.body;
        
        await db.run(
            "UPDATE users SET phone_number = ?, roll_number = ? WHERE user_id = ?",
            [phone_number, roll_number, req.user.id]
        );

        res.json({ msg: "Profile updated successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Get ratings received by user
router.get('/ratings', require('../middleware').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get all ratings received by this user
        const ratings = await db.query(
            `SELECT r.*, u.username as rater_username, t.title as task_title, r.rating_type
             FROM ratings r
             JOIN users u ON r.rater_id = u.user_id
             JOIN tasks t ON r.task_id = t.task_id
             WHERE r.rated_id = ?
             ORDER BY r.created_at DESC`,
            [userId]
        );

        res.json(ratings.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Get leaderboard
router.get('/leaderboard', require('../middleware').authenticateToken, async (req, res) => {
    try {
        const category = req.query.category || 'overall';
        
        let orderBy;
        let selectExtra;
        
        switch(category) {
            case 'giver':
                orderBy = 'trophies_given DESC, giving_rating DESC';
                selectExtra = ', COALESCE(trophies_given, 0) as trophy_count';
                break;
            case 'acceptor':
                orderBy = 'trophies_accepted DESC, accepting_rating DESC';
                selectExtra = ', COALESCE(trophies_accepted, 0) as trophy_count';
                break;
            case 'overall':
            default:
                orderBy = '(COALESCE(trophies_given, 0) + COALESCE(trophies_accepted, 0)) DESC, ((giving_rating + accepting_rating) / 2) DESC';
                selectExtra = ', (COALESCE(trophies_given, 0) + COALESCE(trophies_accepted, 0)) as trophy_count';
                break;
        }
        
        const leaderboard = await db.query(
            `SELECT user_id, username, giving_rating, accepting_rating, 
                    COALESCE(trophies_given, 0) as trophies_given, 
                    COALESCE(trophies_accepted, 0) as trophies_accepted
                    ${selectExtra}
             FROM users
             ORDER BY ${orderBy}
             LIMIT 50`,
            []
        );

        res.json(leaderboard.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
