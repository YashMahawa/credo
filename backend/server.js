const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDb } = require('./database');

const app = express();

// Initialize the database
initDb();

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
