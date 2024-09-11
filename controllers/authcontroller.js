const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM usuarios WHERE username = ?';

  db.query(query, [username], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la base de datos' });
    }

    if (result.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = result[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Error al verificar la contraseña' });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, 'secret_key', { expiresIn: '1h' });

      res.json({ message: 'Login exitoso', token });
    });
  });
};

exports.register = (req, res) => {
  const { username, password, email, phone } = req.body;

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
};

