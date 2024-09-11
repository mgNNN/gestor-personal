const mysql = require('mysql');

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

module.exports = db;

