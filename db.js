const sql = require('mssql');

const config = {
  user: 'adminEcci',  // Usuario de la base de datos
  password: 'ECC14DMIN',  // Contraseña del usuario
  server: 'localhost\\SQLEXPRESS',  // Nombre del servidor y la instancia de SQL Server
  port: 1433,  // Puerto por defecto de SQL Server
  database: 'HyperNova',  // Nombre de la base de datos
  options: {
    encrypt: false,  // Cambia a `true` si estás utilizando cifrado SSL
    trustServerCertificate: true,  // Permite conexiones sin un certificado válido
  },
};

async function connectDB() {
  try {
    const pool = await sql.connect(config);
    console.log("Conexión exitosa a la base de datos");
    return pool;
  } catch (err) {
    console.error("Error de conexión a la base de datos:", err.message);
    throw err; // Vuelve a lanzar el error para que sea visible
  }
}

module.exports = { connectDB, sql };
