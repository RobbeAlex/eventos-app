const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'database', 'eventos.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        return;
    }
    
    db.serialize(() => {
        db.run("ALTER TABLE packages ADD COLUMN precio REAL", (err) => {
            if (err) console.log("packages.precio already exists or error:", err.message);
            else console.log("Added precio to packages");
        });
    });
});
