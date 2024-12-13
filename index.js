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
            res.json({ message: 'Login exitoso',userId: user.id ,token });
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
  
// Endpoint para guardar una rutina completa
app.post('/rutinas', (req, res) => {
    const { nombre, user_id, ejercicios } = req.body;

    // Inserta la rutina en la tabla rutinas
    const sqlRutina = "INSERT INTO rutinas (user_id, nombre) VALUES (?, ?)";
    db.query(sqlRutina, [user_id, nombre], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const rutinaId = result.insertId;

        // Inserta cada ejercicio con sus series
        const seriesPromises = ejercicios.flatMap(ejercicio => {
            const { id: ejercicioId, series } = ejercicio;

            return series.map(serie => {
                const sqlSerie = "INSERT INTO series (rutina_id, ejercicio_id, series, peso, repeticiones) VALUES (?, ?, ?, ?, ?)";
                return new Promise((resolve, reject) => {
                    db.query(sqlSerie, [rutinaId, ejercicioId, serie.series, serie.peso, serie.repeticiones], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });
        });

        // Ejecuta todas las inserciones de series
        Promise.all(seriesPromises)
            .then(() => res.status(201).json({ message: "Rutina guardada exitosamente" }))
            .catch(err => res.status(500).json({ error: err.message }));
    });
});
// Endpoint para actualizar una serie
app.put('/series/:id', (req, res) => {
    const serieId = req.params.id;
    const { peso, repeticiones } = req.body;

    // Verificar que los datos sean válidos
    if (peso === undefined || repeticiones === undefined) {
        return res.status(400).json({ error: "El peso y las repeticiones son requeridos" });
    }

    // Actualizar la serie en la base de datos
    const sql = "UPDATE series SET peso = ?, repeticiones = ? WHERE id = ?";
    db.query(sql, [peso, repeticiones, serieId], (err, result) => {
        if (err) {
            console.error('Error al actualizar la serie:', err);
            return res.status(500).json({ error: 'Error al actualizar la serie' });
        }

        // Verificar si la serie fue actualizada
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Serie no encontrada' });
        }

        res.status(200).json({ message: 'Serie actualizada exitosamente' });
    });
});

app.get('/rutinas', (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ error: 'userId es requerido' });
    }

    const query = `
        SELECT r.id AS rutina_id, r.nombre AS nombre_rutina,e.nombre AS nombre_ejercicio, s.peso, s.series, s.repeticiones, s.id AS serie_id
        FROM rutinas AS r
        LEFT JOIN series AS s ON r.id = s.rutina_id
        LEFT JOIN ejercicios AS e ON s.ejercicio_id = e.id
        WHERE r.user_id = ?;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error en el servidor al obtener las rutinas:', err);
            return res.status(500).json({ error: 'Error en el servidor al obtener las rutinas' });
        }
        res.json(results);
    });
});

// Endpoint para obtener los nombres de los ejercicios
app.get('/ejercicios/nombres', (req, res) => {
    const query = 'SELECT id, nombre FROM ejercicios'; // Ajusta el nombre de la tabla si es necesario

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error al obtener los ejercicios:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        // Formatear el resultado para que cada objeto tenga 'id' y 'nombre'
        const ejercicios = result.map(ejercicio => ({
            id: ejercicio.id,
            nombre: ejercicio.nombre
        }));

        // Enviar el array de objetos como respuesta
        res.json(ejercicios);
    });
});
// Endpoint para guardar un medicamento
app.post('/medicamentos', (req, res) => {
    const { user_id, medicamento, dosis, dosisDia, dosisTomadas, duracionTratamiento, horaPrimeraDosis } = req.body;

    // Inserta el medicamento en la tabla medicamentos
    const sqlMedicamento = `
        INSERT INTO medicamentos (user_id, medicamento, dosis, dosisDia, dosisTomadas, duracionTratamiento, horaPrimeraDosis) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sqlMedicamento, [user_id, medicamento, dosis, dosisDia, dosisTomadas, duracionTratamiento, horaPrimeraDosis], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({ message: "Medicamento guardado exitosamente", medicamento_id: result.insertId });
    });
});
app.get('/medicamentos/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const query = 'SELECT * FROM medicamentos WHERE user_id = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener los medicamentos' });
    }
    res.json(results);
  });
});

// Endpoint para actualizar un medicamento
app.put('/medicamentos/:medicamento_id', (req, res) => {
    const { medicamento_id } = req.params;
    const { medicamento, dosis, dosisDia, dosisTomadas, duracionTratamiento, horaPrimeraDosis } = req.body;

    const sqlUpdateMedicamento = `
        UPDATE medicamentos
        SET medicamento = ?, dosis = ?, dosisDia = ?, dosisTomadas = ?, duracionTratamiento = ?, horaPrimeraDosis = ?
        WHERE id = ?
    `;

    db.query(sqlUpdateMedicamento, [medicamento, dosis, dosisDia, dosisTomadas, duracionTratamiento, horaPrimeraDosis, medicamento_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Medicamento no encontrado" });
        }

        res.status(200).json({ message: "Medicamento actualizado exitosamente" });
    });
});

// Endpoint para eliminar un medicamento
app.delete('/medicamentos/:medicamento_id', (req, res) => {
    const { medicamento_id } = req.params;

    const sqlDeleteMedicamento = `
        DELETE FROM medicamentos
        WHERE id = ?
    `;

    db.query(sqlDeleteMedicamento, [medicamento_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Medicamento no encontrado" });
        }

        res.status(200).json({ message: "Medicamento eliminado exitosamente" });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
