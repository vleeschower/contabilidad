// server.js
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'contabilidad',
    port: 3306
});

db.connect(err => {
    if (err) throw err;
    console.log('Conectado a la base de datos');
});

// Obtener cuentas
app.get('/api/cuentas', (req, res) => {
    db.query('SELECT * FROM catalogocuentas', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Crear movimiento
app.post('/api/movimientos', (req, res) => {
    const { cuenta_id, fecha, descripcion, debe, haber, numero_movimiento } = req.body;
    db.query(
        'INSERT INTO movimientos (cuenta_id, fecha, descripcion, debe, haber, numero_movimiento) VALUES (?, ?, ?, ?, ?, ?)',
        [cuenta_id, fecha, descripcion, debe, haber, numero_movimiento],
        (err, results) => {
            if (err) throw err;
            res.json({ id: results.insertId });
        }
    );
});

// Obtener el último número de movimiento
app.get('/api/movimientos/ultimo-numero', (req, res) => {
    db.query('SELECT MAX(numero_movimiento) AS ultimoNumero FROM movimientos', (err, results) => {
        if (err) throw err;
        const ultimoNumero = results[0].ultimoNumero || 1; // Si no hay movimientos, devuelve 1
        res.json({ ultimoNumero });
    });
});

// Obtener movimientos por descripción o por fechas
app.get('/api/movimientos', (req, res) => {
    const { descripcion, fechaInicial, fechaFinal } = req.query;
    let query = 'SELECT * FROM movimientos';
    const conditions = [];

    if (descripcion) {
        conditions.push(`descripcion = '${descripcion}'`);
    }
    if (fechaInicial && fechaFinal) {
        conditions.push(`DATE(fecha) BETWEEN '${fechaInicial}' AND '${fechaFinal}'`);
    }
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Guardar el nombre de la empresa
app.post('/api/empresa', (req, res) => {
    const { nombre } = req.body;
    db.query(
        'INSERT INTO empresa (nombre) VALUES (?)',
        [nombre],
        (err, results) => {
            if (err) throw err;
            res.json({ id: results.insertId });
        }
    );
});

// Obtener el nombre de la empresa
app.get('/api/nombreEmpresa', (req, res) => {
    db.query('SELECT nombre FROM empresa LIMIT 1', (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.json(results[0]); // Devuelve el primer registro de la tabla empresa
        } else {
            res.json({ nombre: '' }); // Si no hay registros, devuelve un objeto vacío
        }
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});