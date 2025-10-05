const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./credo.db');

module.exports = {
  query: (text, params) => {
    return new Promise((resolve, reject) => {
      db.all(text, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({ rows });
        }
      });
    });
  },
  run: (text, params) => {
    return new Promise((resolve, reject) => {
      db.run(text, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }
};
