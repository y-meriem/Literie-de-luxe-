const mysql = require('mysql2/promise');

// Connexion à MySQL
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',      
  password: '',      
  database: 'literie_de_luxe' 
});

module.exports = db;
