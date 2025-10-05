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
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                task_id INTEGER PRIMARY KEY AUTOINCREMENT,
                giver_id INTEGER NOT NULL,
                acceptor_id INTEGER,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                reward TEXT NOT NULL,
                deadline TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'OPEN',
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
    });
};

module.exports = { db, initDb };
