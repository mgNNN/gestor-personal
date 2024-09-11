const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const db = require('./config/db.js');
const loginRouter = require('./login.js');

const app = express();
app.use(bodyParser.json());

// Configuración de la conexión a MySQL (AWS RDS)



const PORT = process.env.PORT || 3006;

// Usar Ruta para login
app.use('/login', loginRoutes);



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
