const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const db = require('./db.js');

const app = express();
app.use(bodyParser.json());

// Configuración de la conexión a MySQL (AWS RDS)



const PORT = process.env.PORT || 3006;

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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
