require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const initializeDB = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE,
            password_hash VARCHAR(255)
        )`);

        const res = await pool.query(`SELECT count(*) as count FROM users`);
        if (parseInt(res.rows[0].count) === 0) {
            const defaultUsers = ['admin1', 'admin2', 'admin3'];
            const insert = 'INSERT INTO users (username, password_hash) VALUES ($1, $2)';
            for (const user of defaultUsers) {
                const hash = await bcrypt.hash('password123', 10);
                await pool.query(insert, [user, hash]);
            }
            console.log('Default users created.');
        }

        await pool.query(`CREATE TABLE IF NOT EXISTS clients (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255),
            empresa VARCHAR(255),
            telefono VARCHAR(255),
            email VARCHAR(255),
            evento_interes VARCHAR(255),
            comentarios TEXT
        )`);

        // Drops (for the migration)
        await pool.query(`DROP TABLE IF EXISTS events CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS packages CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS event_servicios CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS servicios CASCADE`);

        await pool.query(`CREATE TABLE IF NOT EXISTS servicios (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255),
            descripcion TEXT,
            categoria VARCHAR(100),
            precio REAL
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            titulo VARCHAR(255),
            fecha_hora_inicio TIMESTAMP,
            fecha_hora_fin TIMESTAMP,
            cliente_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
            usuario_id INTEGER REFERENCES users(id),
            estado VARCHAR(50)
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS event_servicios (
            id SERIAL PRIMARY KEY,
            evento_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
            servicio_id INTEGER REFERENCES servicios(id) ON DELETE RESTRICT,
            cantidad INTEGER,
            precio_unitario REAL
        )`);
        
        console.log("PostgreSQL database initialized.");
    } catch (err) {
        console.error('Error initializing PostgreSQL database:', err);
    }
};

initializeDB();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
