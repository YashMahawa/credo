const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware');
const router = express.Router();

// Get user's own tasks (given by them) - MUST BE BEFORE /:id
router.get('/my/given', authenticateToken, async (req, res) => {
    try {
        const tasks = await db.query(
            `SELECT t.*, u.username as acceptor_username
             FROM tasks t
             LEFT JOIN users u ON t.acceptor_id = u.user_id
             WHERE t.giver_id = ?
             ORDER BY t.created_at DESC`,
            [req.user.id]
        );
        res.json(tasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get user's accepted tasks - MUST BE BEFORE /:id
router.get('/my/accepted', authenticateToken, async (req, res) => {
    try {
        const tasks = await db.query(
            `SELECT t.*, u.username as giver_username, u.phone_number as giver_phone
             FROM tasks t
             JOIN users u ON t.giver_id = u.user_id
             WHERE t.acceptor_id = ?
             ORDER BY t.created_at DESC`,
            [req.user.id]
        );
        res.json(tasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get user's withdrawn/removed tasks (for rating purposes) - MUST BE BEFORE /:id
router.get('/my/withdrawn-removed', authenticateToken, async (req, res) => {
    try {
        const tasks = await db.query(
            `SELECT t.*, u.username as giver_username, u.phone_number as giver_phone, ta.status as application_status
             FROM task_applications ta
             JOIN tasks t ON ta.task_id = t.task_id
             JOIN users u ON t.giver_id = u.user_id
             WHERE ta.applicant_id = ? AND ta.status IN ('WITHDRAWN', 'REMOVED')
             ORDER BY ta.applied_at DESC`,
            [req.user.id]
        );
        res.json(tasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get user's applications - MUST BE BEFORE /:id
router.get('/my/applications', authenticateToken, async (req, res) => {
    try {
        const applications = await db.query(
            `SELECT a.*, t.title, t.description, t.reward, t.deadline, t.status as task_status,
                    u.username as giver_username
             FROM task_applications a
             JOIN tasks t ON a.task_id = t.task_id
             JOIN users u ON t.giver_id = u.user_id
             WHERE a.applicant_id = ?
             ORDER BY a.applied_at DESC`,
            [req.user.id]
        );
        res.json(applications.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all tasks with optional status filter
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT t.*, u.username as giver_username, u.giving_rating,
                     COALESCE(u.trophies, 0) as giver_trophies
                     FROM tasks t
                     JOIN users u ON t.giver_id = u.user_id`;
        let params = [];
        
        if (status) {
            query += ` WHERE t.status = ?`;
            params.push(status);
        }
        
        query += ` ORDER BY t.created_at DESC`;
        
        const tasks = await db.query(query, params);
        
        // Return tasks with trophies
        const tasksWithTrophies = tasks.rows;
        
        res.json(tasksWithTrophies);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get a single task by ID with applications
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const task = await db.query(
            `SELECT t.*, u.username as giver_username, u.giving_rating, u.phone_number as giver_phone,
                    COALESCE(u.trophies, 0) as giver_trophies
             FROM tasks t
             JOIN users u ON t.giver_id = u.user_id
             WHERE t.task_id = ?`,
            [req.params.id]
        );
        
        if (task.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const taskData = task.rows[0];

        // Get applications for this task
        const applications = await db.query(
            `SELECT a.*, u.username, u.accepting_rating, u.phone_number,
                    COALESCE(u.trophies, 0) as trophies
             FROM task_applications a
             JOIN users u ON a.applicant_id = u.user_id
             WHERE a.task_id = ?
             ORDER BY a.applied_at DESC`,
            [req.params.id]
        );

        // Return applications with trophies
        const applicationsWithTrophies = applications.rows;

        res.json({
            task: taskData,
            applications: applicationsWithTrophies
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a new task
router.post('/', authenticateToken, async (req, res) => {
    const { title, description, reward, deadline } = req.body;
    const giver_id = req.user.id;

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

// Apply for a task
router.post('/:id/apply', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const applicantId = req.user.id;

        // Check if task exists and is open
        const task = await db.query(
            "SELECT * FROM tasks WHERE task_id = ? AND status = 'OPEN'",
            [taskId]
        );

        if (task.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found or not open' });
        }

        // Check if user is the task giver
        if (task.rows[0].giver_id === applicantId) {
            return res.status(400).json({ msg: 'Cannot apply to your own task' });
        }

        // Check if already applied
        const existingApp = await db.query(
            "SELECT * FROM task_applications WHERE task_id = ? AND applicant_id = ?",
            [taskId, applicantId]
        );

        if (existingApp.rows.length > 0) {
            return res.status(400).json({ msg: 'Already applied to this task' });
        }

        // Create application
        await db.run(
            "INSERT INTO task_applications (task_id, applicant_id) VALUES (?, ?)",
            [taskId, applicantId]
        );

        res.status(201).json({ msg: 'Application submitted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Accept an application (by task giver)
router.post('/:id/accept/:applicantId', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const applicantId = req.params.applicantId;
        const giverId = req.user.id;

        // Verify the user is the task giver
        const task = await db.query(
            "SELECT * FROM tasks WHERE task_id = ? AND giver_id = ?",
            [taskId, giverId]
        );

        if (task.rows.length === 0) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        if (task.rows[0].status !== 'OPEN') {
            return res.status(400).json({ msg: 'Task is not open' });
        }

        // Update task status and set acceptor
        await db.run(
            "UPDATE tasks SET status = 'IN_PROGRESS', acceptor_id = ? WHERE task_id = ?",
            [applicantId, taskId]
        );

        // Update application status
        await db.run(
            "UPDATE task_applications SET status = 'ACCEPTED' WHERE task_id = ? AND applicant_id = ?",
            [taskId, applicantId]
        );

        // Reject all other applications
        await db.run(
            "UPDATE task_applications SET status = 'REJECTED' WHERE task_id = ? AND applicant_id != ?",
            [taskId, applicantId]
        );

        res.json({ msg: 'Application accepted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Reject an application (by task giver)
router.post('/:id/reject/:applicantId', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const applicantId = req.params.applicantId;
        const giverId = req.user.id;

        // Verify the user is the task giver
        const task = await db.query(
            "SELECT * FROM tasks WHERE task_id = ? AND giver_id = ?",
            [taskId, giverId]
        );

        if (task.rows.length === 0) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Update application status
        await db.run(
            "UPDATE task_applications SET status = 'REJECTED' WHERE task_id = ? AND applicant_id = ?",
            [taskId, applicantId]
        );

        res.json({ msg: 'Application rejected' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Complete a task (by task giver)
router.post('/:id/complete', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const giverId = req.user.id;

        // Verify the user is the task giver
        const task = await db.query(
            "SELECT * FROM tasks WHERE task_id = ? AND giver_id = ?",
            [taskId, giverId]
        );

        if (task.rows.length === 0) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        if (task.rows[0].status !== 'IN_PROGRESS') {
            return res.status(400).json({ msg: 'Task must be in progress to complete' });
        }

        const acceptorId = task.rows[0].acceptor_id;

        // Update task status
        await db.run(
            "UPDATE tasks SET status = 'COMPLETED' WHERE task_id = ?",
            [taskId]
        );

        // Award trophy (tasks completed successfully)
        if (acceptorId) {
            console.log(`Awarding trophy: acceptor ${acceptorId}`);
            
            // Give trophy to acceptor for completing the task
            const acceptorResult = await db.run(
                "UPDATE users SET trophies = COALESCE(trophies, 0) + 1 WHERE user_id = ?",
                [acceptorId]
            );
            console.log('Trophy update result:', acceptorResult);
        } else {
            console.log('No acceptor found, skipping trophy award');
        }

        res.json({ msg: 'Task marked as completed. Trophy awarded!' });
    } catch (err) {
        console.error('Error completing task:', err.message);
        res.status(500).send('Server Error');
    }
});

// Cancel a task (by task giver)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const giverId = req.user.id;

        // Verify the user is the task giver
        const task = await db.query(
            "SELECT * FROM tasks WHERE task_id = ? AND giver_id = ?",
            [taskId, giverId]
        );

        if (task.rows.length === 0) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Update task status to CANCELLED
        await db.run(
            "UPDATE tasks SET status = 'CANCELLED' WHERE task_id = ?",
            [taskId]
        );

        res.json({ msg: 'Task cancelled successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Rate a user after task completion
router.post('/:id/rate', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const raterId = req.user.id;
        const { rating_value, comment, rated_user_id } = req.body;

        if (!rating_value || rating_value < 1 || rating_value > 5) {
            return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
        }

        // Get task details
        const task = await db.query(
            "SELECT * FROM tasks WHERE task_id = ?",
            [taskId]
        );

        if (task.rows.length === 0) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const taskData = task.rows[0];

        // Check if user was involved in this task through applications (for WITHDRAWN/REMOVED cases)
        const application = await db.query(
            "SELECT * FROM task_applications WHERE task_id = ? AND applicant_id = ? AND status IN ('WITHDRAWN', 'REMOVED')",
            [taskId, raterId]
        );

        // Verify the user is involved in the task
        const isGiver = taskData.giver_id === raterId;
        const isAcceptor = taskData.acceptor_id === raterId;
        const wasWithdrawn = application.rows.length > 0 && application.rows[0].applicant_id === raterId && application.rows[0].status === 'WITHDRAWN';
        const wasRemoved = application.rows.length > 0 && application.rows[0].applicant_id === raterId && application.rows[0].status === 'REMOVED';

        if (!isGiver && !isAcceptor && !wasWithdrawn && !wasRemoved) {
            return res.status(403).json({ msg: 'Not authorized to rate this task' });
        }

        // Allow rating only in specific cases:
        // 1. COMPLETED tasks: both can rate each other
        // 2. CANCELLED tasks: acceptor can rate giver
        // 3. WITHDRAWN: giver can rate the acceptor who withdrew
        // 4. REMOVED: removed acceptor can rate the giver
        if (taskData.status === 'COMPLETED') {
            // Both parties can rate
        } else if (taskData.status === 'CANCELLED') {
            // Only acceptor can rate giver
            if (!isAcceptor) {
                return res.status(403).json({ msg: 'Only acceptor can rate on cancelled tasks' });
            }
        } else if (wasWithdrawn) {
            // Only giver can rate the acceptor who withdrew
            if (!isGiver) {
                return res.status(403).json({ msg: 'Only giver can rate after withdrawal' });
            }
        } else if (wasRemoved) {
            // Only removed acceptor can rate the giver
            if (!wasRemoved || rated_user_id !== taskData.giver_id) {
                return res.status(403).json({ msg: 'Only removed acceptor can rate the giver' });
            }
        } else {
            return res.status(400).json({ msg: 'Task must be completed, cancelled, or have withdrawal/removal' });
        }

        // Determine rating type based on who is rating whom
        let rating_type;
        
        // For withdrawn/removed cases, check the application
        if (wasWithdrawn || wasRemoved) {
            const withdrawnUser = application.rows[0].applicant_id;
            
            if (wasWithdrawn) {
                // Giver rating the withdrawn acceptor
                if (raterId === taskData.giver_id && rated_user_id === withdrawnUser) {
                    rating_type = 'ACCEPTING';
                } else {
                    return res.status(403).json({ msg: 'Only giver can rate withdrawn acceptor' });
                }
            } else if (wasRemoved) {
                // Removed acceptor rating the giver
                if (raterId === withdrawnUser && rated_user_id === taskData.giver_id) {
                    rating_type = 'GIVING';
                } else {
                    return res.status(403).json({ msg: 'Only removed acceptor can rate the giver' });
                }
            }
        } else {
            // Normal cases: completed or cancelled
            if (raterId === taskData.giver_id && rated_user_id === taskData.acceptor_id) {
                rating_type = 'ACCEPTING';
                
                // If task is cancelled, giver cannot rate acceptor
                if (taskData.status === 'CANCELLED') {
                    return res.status(403).json({ msg: 'Cannot rate acceptor for a cancelled task' });
                }
            } else if (raterId === taskData.acceptor_id && rated_user_id === taskData.giver_id) {
                rating_type = 'GIVING';
            } else {
                return res.status(400).json({ msg: 'Invalid rating configuration' });
            }
        }

        // Check if already rated
        const existingRating = await db.query(
            "SELECT * FROM ratings WHERE task_id = ? AND rater_id = ?",
            [taskId, raterId]
        );

        if (existingRating.rows.length > 0) {
            return res.status(400).json({ msg: 'You have already rated this task' });
        }

        // Insert rating
        await db.run(
            "INSERT INTO ratings (task_id, rater_id, rated_id, rating_value, rating_type, comment) VALUES (?, ?, ?, ?, ?, ?)",
            [taskId, raterId, rated_user_id, rating_value, rating_type, comment]
        );

        // Update user's average rating (including initial 5.0)
        const sumRating = await db.query(
            `SELECT SUM(rating_value) as sum_rating, COUNT(*) as count FROM ratings WHERE rated_id = ? AND rating_type = ?`,
            [rated_user_id, rating_type]
        );

        const sum = sumRating.rows[0].sum_rating || 0;
        const count = sumRating.rows[0].count || 0;
        const newAvg = (5.0 + sum) / (count + 1);
        
        const ratingColumn = rating_type === 'GIVING' ? 'giving_rating' : 'accepting_rating';
        const countColumn = rating_type === 'GIVING' ? 'giving_rating_count' : 'accepting_rating_count';
        
        await db.run(
            `UPDATE users SET ${ratingColumn} = ?, ${countColumn} = ? WHERE user_id = ?`,
            [newAvg, count, rated_user_id]
        );

        res.json({ msg: 'Rating submitted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Check if user has rated a task
router.get('/:id/has-rated', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;

        const rating = await db.query(
            "SELECT * FROM ratings WHERE task_id = ? AND rater_id = ?",
            [taskId, userId]
        );

        res.json({ has_rated: rating.rows.length > 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Duplicate a task
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const giverId = req.user.id;
        const { title, description, reward, deadline } = req.body;

        // Verify the user owns the original task
        const originalTask = await db.query(
            "SELECT * FROM tasks WHERE task_id = ? AND giver_id = ?",
            [taskId, giverId]
        );

        if (originalTask.rows.length === 0) {
            return res.status(403).json({ msg: 'Not authorized or task not found' });
        }

        // Create new task with provided modifications
        const result = await db.run(
            "INSERT INTO tasks (giver_id, title, description, reward, deadline) VALUES (?, ?, ?, ?, ?)",
            [giverId, title, description, reward, deadline]
        );
        
        const newTask = await db.query("SELECT * FROM tasks WHERE task_id = ?", [result.lastID]);
        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Edit task (extend deadline and add comment about changes)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const giverId = req.user.id;
        const { deadline, comment } = req.body;

        // Verify the user owns the task
        const task = await db.query(
            "SELECT * FROM tasks WHERE task_id = ? AND giver_id = ?",
            [taskId, giverId]
        );

        if (task.rows.length === 0) {
            return res.status(403).json({ msg: 'Not authorized or task not found' });
        }

        // Update deadline
        if (deadline) {
            await db.run(
                "UPDATE tasks SET deadline = ? WHERE task_id = ?",
                [deadline, taskId]
            );
        }

        // Add comment about changes
        if (comment) {
            await db.run(
                "INSERT INTO task_comments (task_id, user_id, comment_text) VALUES (?, ?, ?)",
                [taskId, giverId, comment]
            );
        }

        res.json({ msg: 'Task updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get comments for a task (with nested structure)
router.get('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const comments = await db.query(
            `SELECT c.*, u.username, COALESCE(u.trophies, 0) as trophies, t.giver_id
             FROM task_comments c
             JOIN users u ON c.user_id = u.user_id
             JOIN tasks t ON c.task_id = t.task_id
             WHERE c.task_id = ?
             ORDER BY c.created_at ASC`,
            [req.params.id]
        );
        
        // Build nested structure
        const commentMap = {};
        const rootComments = [];
        
        comments.rows.forEach(comment => {
            comment.replies = [];
            comment.total_trophies = (comment.trophies_given || 0) + (comment.trophies_accepted || 0);
            commentMap[comment.comment_id] = comment;
        });
        
        comments.rows.forEach(comment => {
            if (comment.parent_comment_id) {
                if (commentMap[comment.parent_comment_id]) {
                    commentMap[comment.parent_comment_id].replies.push(comment);
                }
            } else {
                rootComments.push(comment);
            }
        });
        
        res.json(rootComments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add comment to a task (supports nested replies)
router.post('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;
        const { comment_text, parent_comment_id } = req.body;

        if (!comment_text || comment_text.trim() === '') {
            return res.status(400).json({ msg: 'Comment cannot be empty' });
        }

        await db.run(
            "INSERT INTO task_comments (task_id, user_id, comment_text, parent_comment_id) VALUES (?, ?, ?, ?)",
            [taskId, userId, comment_text, parent_comment_id || null]
        );

        const newComment = await db.query(
            `SELECT c.*, u.username, COALESCE(u.trophies, 0) as trophies, t.giver_id
             FROM task_comments c
             JOIN users u ON c.user_id = u.user_id
             JOIN tasks t ON c.task_id = t.task_id
             WHERE c.comment_id = last_insert_rowid()`,
            []
        );

        const comment = newComment.rows[0];
        comment.replies = [];
        comment.total_trophies = (comment.trophies_given || 0) + (comment.trophies_accepted || 0);

        res.status(201).json(comment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Auto-cancel expired tasks (to be called periodically)
router.post('/auto-cancel-expired', authenticateToken, async (req, res) => {
    try {
        const result = await db.run(
            `UPDATE tasks 
             SET status = 'CANCELLED' 
             WHERE status = 'OPEN' 
             AND datetime(deadline) < datetime('now')`,
            []
        );

        res.json({ 
            msg: 'Expired tasks cancelled', 
            count: result.changes 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Acceptor says "Can't do it" - releases them from task and reopens it
router.post('/:id/cant-do', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ msg: 'Reason is required' });
        }

        // Verify the user is the acceptor
        const task = await db.query(
            "SELECT * FROM tasks WHERE task_id = ? AND acceptor_id = ? AND status = 'IN_PROGRESS'",
            [taskId, userId]
        );

        if (task.rows.length === 0) {
            return res.status(403).json({ msg: 'Not authorized or task is not in progress' });
        }

        const taskData = task.rows[0];

        // Create a record of the withdrawal with reason
        await db.run(
            "INSERT INTO task_applications (task_id, applicant_id, status) VALUES (?, ?, ?)",
            [taskId, userId, 'WITHDRAWN']
        );

        // Add reason as a comment
        await db.run(
            "INSERT INTO task_comments (task_id, user_id, comment_text) VALUES (?, ?, ?)",
            [taskId, userId, `[WITHDRAWN] Reason: ${reason}`]
        );

        // Reset task to OPEN and remove acceptor
        await db.run(
            "UPDATE tasks SET status = 'OPEN', acceptor_id = NULL WHERE task_id = ?",
            [taskId]
        );

        res.json({ msg: 'Task released successfully. Giver can now rate you.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Giver removes acceptor - reopens task
router.post('/:id/remove-acceptor', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const giverId = req.user.id;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ msg: 'Reason is required' });
        }

        // Verify the user is the task giver
        const task = await db.query(
            "SELECT * FROM tasks WHERE task_id = ? AND giver_id = ? AND status = 'IN_PROGRESS'",
            [taskId, giverId]
        );

        if (task.rows.length === 0) {
            return res.status(403).json({ msg: 'Not authorized or task is not in progress' });
        }

        const taskData = task.rows[0];
        const acceptorId = taskData.acceptor_id;

        if (!acceptorId) {
            return res.status(400).json({ msg: 'No acceptor assigned to this task' });
        }

        // Update application status to REMOVED
        await db.run(
            "UPDATE task_applications SET status = 'REMOVED' WHERE task_id = ? AND applicant_id = ?",
            [taskId, acceptorId]
        );

        // Add reason as a comment
        await db.run(
            "INSERT INTO task_comments (task_id, user_id, comment_text) VALUES (?, ?, ?)",
            [taskId, giverId, `[REMOVED ACCEPTOR] Reason: ${reason}`]
        );

        // Reset task to OPEN and remove acceptor
        await db.run(
            "UPDATE tasks SET status = 'OPEN', acceptor_id = NULL WHERE task_id = ?",
            [taskId]
        );

        res.json({ msg: 'Acceptor removed successfully. They can now rate you.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
