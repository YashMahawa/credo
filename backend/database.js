const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./credo.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the credo database.');
});

const initDb = () => {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                phone_number TEXT UNIQUE NOT NULL,
                roll_number TEXT UNIQUE NOT NULL,
                giving_rating REAL DEFAULT 5.0,
                accepting_rating REAL DEFAULT 5.0,
                giving_rating_count INTEGER DEFAULT 0,
                accepting_rating_count INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add rating count columns if they don't exist (migration)
        db.run(`ALTER TABLE users ADD COLUMN giving_rating_count INTEGER DEFAULT 0`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding giving_rating_count:', err.message);
            }
        });
        db.run(`ALTER TABLE users ADD COLUMN accepting_rating_count INTEGER DEFAULT 0`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding accepting_rating_count:', err.message);
            }
        });
        db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                task_id INTEGER PRIMARY KEY AUTOINCREMENT,
                giver_id INTEGER NOT NULL,
                acceptor_id INTEGER,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                reward TEXT NOT NULL,
                deadline TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (giver_id) REFERENCES users (user_id),
                FOREIGN KEY (acceptor_id) REFERENCES users (user_id)
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS task_applications (
                application_id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                applicant_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks (task_id) ON DELETE CASCADE,
                FOREIGN KEY (applicant_id) REFERENCES users (user_id),
                UNIQUE(task_id, applicant_id)
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS ratings (
                rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                rater_id INTEGER NOT NULL,
                rated_id INTEGER NOT NULL,
                rating_value INTEGER NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
                rating_type TEXT NOT NULL CHECK (rating_type IN ('GIVING', 'ACCEPTING')),
                comment TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks (task_id),
                FOREIGN KEY (rater_id) REFERENCES users (user_id),
                FOREIGN KEY (rated_id) REFERENCES users (user_id)
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS task_comments (
                comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                comment_text TEXT NOT NULL,
                parent_comment_id INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks (task_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (user_id),
                FOREIGN KEY (parent_comment_id) REFERENCES task_comments (comment_id) ON DELETE CASCADE
            )
        `);
        
        // Add trophies column (tasks completed successfully)
        db.run(`ALTER TABLE users ADD COLUMN trophies INTEGER DEFAULT 0`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding trophies:', err.message);
            }
        });
        
        // Migrate old data: trophies = trophies_accepted (if columns exist)
        db.run(`UPDATE users SET trophies = COALESCE(trophies_accepted, 0) WHERE trophies = 0`, (err) => {
            if (err && !err.message.includes('no such column')) {
                console.error('Error migrating trophies:', err.message);
            }
        });
        
        // Add parent_comment_id column if it doesn't exist (migration)
        db.run(`ALTER TABLE task_comments ADD COLUMN parent_comment_id INTEGER REFERENCES task_comments(comment_id) ON DELETE CASCADE`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding parent_comment_id:', err.message);
            }
        });
    });
};

module.exports = { db, initDb };
