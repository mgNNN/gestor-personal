const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db'); // Configuración de la base de datos
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();
app.use(bodyParser.json());

// Usar las rutas
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

