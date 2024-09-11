const express = require('express');
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const db = require('./config/db.js'); // Importar la conexión a la base de datos

const router = express.Router();

// Ruta para login
router.post('/', (req, res) => {
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

module.exports = router;

