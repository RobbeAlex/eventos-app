const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'database', 'eventos.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        return;
    }
    
    db.serialize(() => {
        db.run("ALTER TABLE clients ADD COLUMN evento_interes TEXT", (err) => {
            if (err) console.log("clients.evento_interes already exists or error:", err.message);
            else console.log("Added evento_interes to clients");
        });
        db.run("ALTER TABLE clients ADD COLUMN comentarios TEXT", (err) => {
            if (err) console.log("clients.comentarios already exists or error:", err.message);
            else console.log("Added comentarios to clients");
        });
        db.run("ALTER TABLE events ADD COLUMN precio REAL", (err) => {
            if (err) console.log("events.precio already exists or error:", err.message);
            else console.log("Added precio to events");
        });
    });
});
