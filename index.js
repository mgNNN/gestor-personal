const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas

const app = express();
app.use(bodyParser.json());

// Configuración de la conexión a MySQL (AWS RDS)
const db = mysql.createConnection({
    host: 'gestionpersonaldb.cnygamc4oi4y.eu-north-1.rds.amazonaws.com',
    user: 'admin',
    password: 'P8r!Y9z#kL',
    database: 'miapp'
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

const PORT = process.env.PORT || 3006;

// Función para autenticar el token (middleware)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token requerido' });

    jwt.verify(token, 'secret_key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

// Endpoint para obtener todos los productos
app.get('/products', (req, res) => {
    const query = 'SELECT * FROM productos';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los productos' });
        }
        res.json(results);
    });
});

// Endpoint para crear un nuevo producto
app.post('/products', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }

    const query = 'INSERT INTO productos (name) VALUES (?)';
    db.query(query, [name], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al crear el producto' });
        }
        res.status(201).json({ message: 'Producto creado con éxito', id: result.insertId });
    });
});

// Endpoint para actualizar un producto
app.put('/products/:id', (req, res) => {
    const productId = req.params.id;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }

    const query = 'UPDATE productos SET name = ? WHERE id = ?';
    db.query(query, [name, productId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al actualizar el producto' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto actualizado con éxito' });
    });
});

// Endpoint para eliminar un producto
app.delete('/products/:id', (req, res) => {
    const productId = req.params.id;

    const query = 'DELETE FROM productos WHERE id = ?';
    db.query(query, [productId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar el producto' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto eliminado con éxito' });
    });
});

// Ruta para login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Consulta a la base de datos para verificar el usuario
    const query = 'SELECT * FROM usuarios WHERE username = ?';
    db.query(query, [username], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        if (result.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = result[0];

        // Verificar la contraseña
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Error al verificar la contraseña' });
            }
            if (!isMatch) {
                return res.status(401).json({ error: 'Contraseña incorrecta' });
            }

            // Generar token JWT
            const token = jwt.sign({ id: user.id, username: user.username }, 'secret_key', {
                expiresIn: '1h',
            });
            res.json({ message: 'Login exitoso', token });
        });
    });
});

// Ruta para registrar un nuevo usuario
app.post('/register', (req, res) => {
    const { username, password, email, phone } = req.body;

    // Encriptar la contraseña antes de guardarla
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'Error al encriptar la contraseña' });
        }

        const query = 'INSERT INTO usuarios (username, password, correo_electronico, numero_telefono) VALUES (?, ?, ?, ?)';
        db.query(query, [username, hashedPassword, email, phone], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error al crear el usuario' });
            }
            res.json({ message: 'Usuario creado con éxito' });
        });
    });
});

// Ruta para añadir rutina
app.post('/crear-rutina', authenticateToken, (req, res) => {
    const { userId, ejercicio, series, repeticiones, peso } = req.body;

    // Validar que todos los datos requeridos están presentes
    if (!userId || !ejercicio || !series || !repeticiones) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Consulta SQL adaptada a la estructura de tu tabla
    const query = 'INSERT INTO rutinas (user_id, ejercicio, series, repeticiones, peso) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [userId, ejercicio, series, repeticiones, peso], (err, result) => {
        if (err) {
            // Manejo de error al insertar los datos en la base de datos
            return res.status(500).json({ error: 'Error al crear la rutina' });
        }
        // Respuesta exitosa
        res.status(200).json({ message: 'Rutina creada con éxito', rutinaId: result.insertId });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
