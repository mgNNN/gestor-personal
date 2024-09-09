const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const bodyParser = require('body-parser');

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
    if (password !== user.password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar token JWT
    const token = jwt.sign({ id: user.id, username: user.username }, 'secret_key', {
      expiresIn: '1h',
    });

    res.json({ message: 'Login exitoso', token });
  });
});
 
// Ruta para registrar un nuevo usuario (opcional)
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  const query = 'INSERT INTO usuarios (username, password) VALUES (?, ?)';
  db.query(query, [username, password], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al crear el usuario' });
    }
    res.json({ message: 'Usuario creado con éxito' });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
