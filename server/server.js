require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.SECRET_KEY || 'super-secret-key-for-jwt-12345';

app.use(cors());
app.use(express.json());

// --- Authentication ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query(`SELECT * FROM users WHERE username = $1`, [username]);
        const user = result.rows[0];
        
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Clients API ---
app.get('/api/clients', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM clients`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
    const { nombre, empresa, telefono, email, evento_interes, comentarios } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO clients (nombre, empresa, telefono, email, evento_interes, comentarios) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [nombre, empresa, telefono, email, evento_interes, comentarios]
        );
        res.json({ id: result.rows[0].id, nombre, empresa, telefono, email, evento_interes, comentarios });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
    const { nombre, empresa, telefono, email, evento_interes, comentarios } = req.body;
    try {
        await db.query(
            `UPDATE clients SET nombre = $1, empresa = $2, telefono = $3, email = $4, evento_interes = $5, comentarios = $6 WHERE id = $7`,
            [nombre, empresa, telefono, email, evento_interes, comentarios, req.params.id]
        );
        res.json({ id: req.params.id, nombre, empresa, telefono, email, evento_interes, comentarios });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`DELETE FROM clients WHERE id = $1`, [req.params.id]);
        res.json({ deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Services API ---
app.get('/api/services', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM servicios`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/services', authenticateToken, async (req, res) => {
    const { nombre, descripcion, categoria, precio } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO servicios (nombre, descripcion, categoria, precio) VALUES ($1, $2, $3, $4) RETURNING id`,
            [nombre, descripcion, categoria, precio || 0]
        );
        res.json({ id: result.rows[0].id, nombre, descripcion, categoria, precio: precio || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/services/:id', authenticateToken, async (req, res) => {
    const { nombre, descripcion, categoria, precio } = req.body;
    try {
        await db.query(
            `UPDATE servicios SET nombre = $1, descripcion = $2, categoria = $3, precio = $4 WHERE id = $5`,
            [nombre, descripcion, categoria, precio || 0, req.params.id]
        );
        res.json({ id: req.params.id, nombre, descripcion, categoria, precio: precio || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/services/:id', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`DELETE FROM servicios WHERE id = $1`, [req.params.id]);
        res.json({ deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Events API ---
app.get('/api/events', authenticateToken, async (req, res) => {
    const sql = `
        SELECT 
            e.id, e.titulo, e.cliente_id, e.usuario_id, e.estado,
            to_char(e.fecha_hora_inicio, 'YYYY-MM-DD"T"HH24:MI:SS') as fecha_hora_inicio,
            to_char(e.fecha_hora_fin, 'YYYY-MM-DD"T"HH24:MI:SS') as fecha_hora_fin,
            c.nombre as cliente_nombre,
            COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', es.servicio_id, 
                    'nombre', s.nombre, 
                    'categoria', s.categoria, 
                    'cantidad', es.cantidad, 
                    'precio_unitario', es.precio_unitario
                ))
                FROM event_servicios es
                JOIN servicios s ON es.servicio_id = s.id
                WHERE es.evento_id = e.id),
                '[]'::json
            ) as carrito,
            COALESCE(
                (SELECT sum(es.cantidad * es.precio_unitario) 
                FROM event_servicios es 
                WHERE es.evento_id = e.id),
                0
            ) as precio_total
        FROM events e
        LEFT JOIN clients c ON e.cliente_id = c.id
    `;
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/events', authenticateToken, async (req, res) => {
    const { titulo, fecha_hora_inicio, fecha_hora_fin, cliente_id, estado, carrito } = req.body;
    const usuario_id = req.user.id;
    
    try {
        // Validation: Verify if the selected "Lugar" services conflict
        // Extract lugar service IDs from the cart
        const lugaresIds = carrito.filter(item => item.categoria === 'Lugar').map(item => item.id);
        
        if (lugaresIds.length > 0) {
            const sqlCheck = `
                SELECT e.id FROM events e
                JOIN event_servicios es ON e.id = es.evento_id
                WHERE es.servicio_id = ANY($1)
                AND (
                    (e.fecha_hora_inicio < $2 AND e.fecha_hora_fin > $3)
                )
            `;
            const checkResult = await db.query(sqlCheck, [lugaresIds, fecha_hora_fin, fecha_hora_inicio]);
            
            if (checkResult.rows.length > 0) {
                return res.status(409).json({ error: 'Conflict: El lugar seleccionado ya está ocupado en ese horario.', conflicts: checkResult.rows });
            }
        }
        
        // Begin transaction
        await db.query('BEGIN');
        
        const result = await db.query(
            `INSERT INTO events (titulo, fecha_hora_inicio, fecha_hora_fin, cliente_id, usuario_id, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [titulo, fecha_hora_inicio, fecha_hora_fin, cliente_id, usuario_id, estado || 'agendado']
        );
        const evento_id = result.rows[0].id;
        
        // Insert items into event_servicios
        for (const item of carrito) {
            await db.query(
                `INSERT INTO event_servicios (evento_id, servicio_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)`,
                [evento_id, item.id, item.cantidad, item.precio]
            );
        }
        
        await db.query('COMMIT');
        
        res.json({ id: evento_id, titulo, estado: estado || 'agendado' });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/events/:id', authenticateToken, async (req, res) => {
    const { titulo, fecha_hora_inicio, fecha_hora_fin, cliente_id, estado, carrito } = req.body;
    try {
        if (!carrito) {
            // It's just a status update (from the list view)
            await db.query(`UPDATE events SET estado = $1 WHERE id = $2`, [estado, req.params.id]);
            return res.json({ id: req.params.id, estado });
        }

        // Full update: Validation: Verify if the selected "Lugar" services conflict
        const lugaresIds = carrito.filter(item => item.categoria === 'Lugar').map(item => item.id);
        
        if (lugaresIds.length > 0) {
            const sqlCheck = `
                SELECT e.id FROM events e
                JOIN event_servicios es ON e.id = es.evento_id
                WHERE es.servicio_id = ANY($1)
                AND e.id != $4
                AND (
                    (e.fecha_hora_inicio < $2 AND e.fecha_hora_fin > $3)
                )
            `;
            const checkResult = await db.query(sqlCheck, [lugaresIds, fecha_hora_fin, fecha_hora_inicio, req.params.id]);
            
            if (checkResult.rows.length > 0) {
                return res.status(409).json({ error: 'Conflict: El lugar seleccionado ya está ocupado en ese horario.', conflicts: checkResult.rows });
            }
        }

        await db.query('BEGIN');
        await db.query(
            `UPDATE events SET titulo = $1, fecha_hora_inicio = $2, fecha_hora_fin = $3, cliente_id = $4, estado = $5 WHERE id = $6`,
            [titulo, fecha_hora_inicio, fecha_hora_fin, cliente_id, estado, req.params.id]
        );
        
        // Replace cart items
        await db.query(`DELETE FROM event_servicios WHERE evento_id = $1`, [req.params.id]);
        
        for (const item of carrito) {
            await db.query(
                `INSERT INTO event_servicios (evento_id, servicio_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)`,
                [req.params.id, item.id, item.cantidad, item.precio || item.precio_unitario]
            );
        }
        
        await db.query('COMMIT');
        res.json({ id: req.params.id, titulo, estado });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/events/:id', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`DELETE FROM events WHERE id = $1`, [req.params.id]);
        res.json({ deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Frontend Build Integration ---
// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/^(.*)$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
