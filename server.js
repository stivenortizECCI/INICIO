const express = require("express");
const session = require("express-session");
const path = require("path");
const { connectDB } = require('./db');
const cors = require('cors');
const sql = require('mssql');  
const bcrypt = require('bcrypt');

const PORT = 3000;
const app = express();

let pool; 

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));

app.use(session({
  secret: 'ECC14DMIN', 
  resave: false,      
  saveUninitialized: true, 
  cookie: {
    secure: false,         
    httpOnly: true,        
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Conexión a Base de Datos
connectDB().then(p => {
  pool = p;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('No se pudo conectar a la BD:', err);
});

// Servir el frontend
app.use(express.static(path.join(__dirname, "../frontend")));

app.get('/check-session', (req, res) => {
  if (req.session.user) {
    res.json({ success: true, user: req.session.user }); 
  } else {
    res.json({ success: false });
  }
});


// CUENTA // 

// Registro
app.post('/register', async (req, res) => {
  const {
    username,
    email,
    password,
    first_name,
    last_name,
    birthdate,
    country,
    city,
    address
  } = req.body;

  try {
    const pool = await connectDB();

    // Verifica si el usuario o correo ya existen
    const existing = await pool.request()
      .input('username', sql.NVarChar(100), username)
      .input('email', sql.NVarChar(150), email)
      .query(`SELECT * FROM users WHERE username = @username OR email = @email`);

    if (existing.recordset.length > 0) {
      const userExists = existing.recordset.find(u => u.username === username);
      const emailExists = existing.recordset.find(u => u.email === email);
      const message = userExists ? 'El nombre de usuario ya está en uso.' :
                        emailExists ? 'El correo electrónico ya está registrado.' :
                        'Usuario o correo ya existentes.';
      return res.status(400).json({ success: false, message });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    await pool.request()
      .input('username', sql.NVarChar(100), username)
      .input('email', sql.NVarChar(150), email)
      .input('password', sql.NVarChar(255), hashedPassword)
      .input('first_name', sql.NVarChar(100), first_name || null)
      .input('last_name', sql.NVarChar(100), last_name || null)
      .input('birthdate', sql.Date, birthdate || null)
      .input('country', sql.NVarChar(100), country || null)
      .input('city', sql.NVarChar(100), city || null)
      .input('address', sql.NVarChar(255), address || null)
      .input('created_at', sql.DateTime, now)
      .input('updated_at', sql.DateTime, now)
      .query(`
        INSERT INTO users (username, email, password, first_name, last_name, birthdate, country, city, address, created_at, updated_at)
        VALUES (@username, @email, @password, @first_name, @last_name, @birthdate, @country, @city, @address, @created_at, @updated_at)
      `);

    res.json({ success: true, message: 'Usuario registrado exitosamente' });
  } catch (err) {
    console.error('Error en el registro:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return res.status(400).json({
      success: false,
      message: 'El nombre de usuario solo puede contener letras y números.'
    });
  }

  try {
    const result = await pool.request()

      .input('username', sql.VarChar, username)
      .query('SELECT * FROM users WHERE username = @username');

    if (result.recordset.length > 0) {

      const user = result.recordset[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        req.session.user = {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          user_type_id: user.user_type_id
        };
        res.json({ success: true, user_type_id: user.user_type_id }); 
      } else {
        res.json({ success: false, message: 'Contraseña incorrecta' });
      }
      

    } else {
      res.json({ success: false, message: 'Usuario no existe' });
    }
  } catch (err) {
    console.error('Error al consultar SQL Server:', err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// Mi cuenta
app.get('/account', async (req, res) => {
  if (!req.session.user || !req.session.user.username) {
    console.log("Sesión no autorizada");
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  try {
    console.log("Sesión autorizada");

    const pool = await connectDB();
    const result = await pool.request()
      .input('username', sql.NVarChar(100), req.session.user.username)
      .query('SELECT username, email, first_name, last_name, birthdate, country, city, address FROM users WHERE username = @username');

    if (result.recordset.length > 0) {
      res.json({ success: true, user: result.recordset[0] });
    } else {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
  } catch (err) {
    console.error('Error al obtener datos del usuario:', err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// Update Account
app.put('/account', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  const {
    email,
    first_name,
    last_name,
    birthdate,
    country,
    city,
    address
  } = req.body;

 const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const pool = await connectDB();
    await pool.request()
      .input('user_id', sql.Int, req.session.user.user_id)
      .input('email', sql.NVarChar(150), email)
      .input('first_name', sql.NVarChar(100), first_name || null)
      .input('last_name', sql.NVarChar(100), last_name || null)
      .input('birthdate', sql.Date, birthdate || null)
      .input('country', sql.NVarChar(100), country || null)
      .input('city', sql.NVarChar(100), city || null)
      .input('address', sql.NVarChar(255), address || null)
      .input('updated_at', sql.DateTime, new Date())
      .query(`
        UPDATE users SET 
          email = @email,
          first_name = @first_name,
          last_name = @last_name,
          birthdate = @birthdate,
          country = @country,
          city = @city,
          address = @address,
          updated_at = @updated_at
        WHERE user_id = @user_id
      `);

      console.log("Consulta preparada para ejecutar:");
      console.log(`
        UPDATE users SET 
          email = '${email}',
          first_name = '${first_name}',
          last_name = '${last_name}',
          birthdate = '${birthdate}',
          country = '${country}',
          city = '${city}',
          address = '${address}',
          updated_at = '${new Date().toISOString()}'
        WHERE user_id = ${req.session.user.user_id}
      `);
      

    await transaction.commit(); 

    console.log("Datos recibidos para actualizar:", req.body);
    console.log("Datos actualizados correctamente")
    res.json({ success: true, message: 'Datos actualizados correctamente' });
  } catch (err) {
    console.error('Error al actualizar cuenta:', err);
    await transaction.rollback();
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Ruta para probar la conexión
app.get("/test-db", async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query("SELECT TOP 1 * FROM users"); // Aquí 'users' es el nombre de la tabla
    if (result.recordset.length > 0) {
      res.json(result.recordset); // Responder con los datos de la tabla
    } else {
      res.status(404).send("No se encontraron registros en la tabla");
    }
  } catch (err) {
    console.error("Error al consultar la base de datos", err.message); // Mensaje detallado del error
    res.status(500).send("Error al consultar la base de datos");
  }
});

// Perfil
app.get('/profile', (req, res) => {
  if (req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  } else {
    return res.status(401).json({ loggedIn: false });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// Cerar Sesión
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid'); // Opcional: limpia la cookie de sesión
    res.json({ success: true });
  });
});

// TORNEOS // 

app.get('/tournaments', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        tournament_id,
        name,
        description,
        start_date,
        end_date,
        registration_fee,
        max_participants
      FROM tournaments
      ORDER BY start_date DESC
    `);

    res.json({ success: true, tournaments: result.recordset });
  } catch (err) {
    console.error('Error al obtener torneos:', err);
    res.status(500).json({ success: false, message: 'Error del servidor al obtener torneos' });
  }
});

app.get('/user-registrations', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false });

  try {
    const result = await pool.request()
      .input('user_id', sql.Int, req.session.user.user_id)
      .query('SELECT tournament_id FROM tournament_registrations WHERE user_id = @user_id');

    const inscritos = result.recordset.map(row => row.tournament_id);
    res.json({ success: true, inscritos });

  } catch (err) {
    console.error("Error al obtener inscripciones:", err);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
});


app.post('/inscribirse', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  const { tournament_id } = req.body;
  const user_id = req.session.user.user_id;

  try {
    await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('tournament_id', sql.Int, tournament_id)
      .query(`
        INSERT INTO tournament_registrations (user_id, tournament_id, registration_date, status)
        VALUES (@user_id, @tournament_id, GETDATE(), 'Inscrito')
      `);

    res.json({ success: true, message: 'Inscripción exitosa' });
  } catch (err) {
    console.error('Error al inscribirse:', err);
    res.status(500).json({ success: false, message: 'Error en la inscripción' });
  }
});

