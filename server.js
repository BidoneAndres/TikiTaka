//librerias
const express = require('express'); //framework para crear el servidor
const mysql = require('mysql'); //libreria para conectarse a la base de datos
const bodyParser = require('body-parser'); //libreria para parsear el body de las peticiones
const cors = require('cors'); //libreria para permitir peticiones de otros dominios
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'secretKey';
const JWT_EXPIRES_IN = '2h';
/*Parsear significa analizar o descomponer una estructura de datos o texto según ciertas reglas para entender su contenido y trabajar con él */

const app = express(); //crear una instancia de express

//Configuracion de middleware

app.use(cors()); //permitir peticiones de otros dominios
app.use(bodyParser.json()); //parsear el body de las peticiones a json
app.use(express.static('public')); //servir archivos estaticos desde la carpeta public
app.use(express.urlencoded({ extended: true })); // para formularios tipo HTML
app.use(express.json()); 

let userId; // Variable para almacenar el ID del usuario logueado
//asignacion de puerto
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

//Configuracion de la base de datos

let db; // Esta variable contendrá la conexión global a la base de datos "tikitaka"
//Crear conexión sin base de datos para poder crearla

const tempDb = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ''
});

tempDb.connect((err) => {
  if (err) throw err;
  console.log('✅ Conectado a MySQL (sin DB)');

  //Crear base de datos si no existe
  tempDb.query('CREATE DATABASE IF NOT EXISTS tikitaka', (err, res) => {
    if (err) throw err;
    console.log('✅ Base de datos tikitaka creada o ya existía');

    //Cerrar conexión temporal
    tempDb.end((err) => {
      if (err) throw err;

      //Crear conexión a la base de datos tikitaka
      db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'tikitaka'
      });

      db.connect((err) => {
        if (err) throw err;
        console.log('✅ Conectado a la base de datos tikitaka');

        //Crear la tabla usuarios si no existe
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            lastname VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            birthdate DATE NOT NULL,
            password VARCHAR(255) NOT NULL
          )
        `;
        db.query(createTableQuery, (err, res) => {
          if (err) throw err;
          console.log('✅ Tabla usuarios creada o ya existía');
        });
      });
    });
  });
});

//Rutas POST para procesar login y registro 

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/Pantalla1.html');
});

const bcrypt = require('bcrypt'); //libreria para encriptar contraseñas
let userLoggedIn = 0;
let usernameLoggedIn = '';
//Ruta para el login de usuarios
app.post('/login', (req, res) => {
  const {username, password} = req.body;
  const sql = 'SELECT * FROM usuarios WHERE username = ?';
  db.query(sql, [username], async (err, result) => {
    if (err) return res.status(500).send('Error en la conexion');
    if(result.length > 0) {
      const user = result[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        // Genera el token JWT
        const token = jwt.sign(
          { id: user.id, username: user.username }, //aniadir rol 
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );
        res.send({success: true, message: 'Login exitoso', username: user.username, token});
      } else {
        res.send({success: false, message: 'Usuario o contraseña incorrectos'});
      }
    } else {
      res.send({success: false, message: 'Usuario o contraseña incorrectos'});
    }
  });
});

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Espera 'Bearer <token>'
  if (!token) return res.status(401).send({ success: false, message: 'Token requerido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send({ success: false, message: 'Token inválido o expirado' });
    req.user = user; // user.id y user.username disponibles
    next();
  });
}

//Ruta para el registro de usuarios
app.post('/register', async (req, res) => {
    const { username, name, lastname, email, birthdate, password, repPassword } = req.body;

    //verificar si el usuario ya existe
    const sql = 'SELECT * FROM usuarios WHERE username = ? OR email = ?';
    db.query(sql, [username, email], async (err, result) => {
        if (err) return res.status(500).send('user o mail en uso');
        if(result.length > 0) {
            return res.send({success: false, message: 'El usuario o email ya estan en uso'});
        } else {
            if(password.length < 8) {
                return res.send({success: false, message: 'La contraseña debe tener al menos 8 caracteres'});
            }
            if(password !== repPassword) {
                return res.send({success: false, message: 'Las contraseñas no coinciden'});
            } else {
                // Hashear la contraseña antes del INSERT
                try {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const sql = 'INSERT INTO usuarios (username, name, lastname, birthdate, email, password) VALUES (?, ?, ?, ?, ?, ?)';
                    db.query(sql, [username, name, lastname, birthdate, email, hashedPassword], (err, result) => {
                        if (err) return res.status(500).send('error en la carga de los datos');
                        res.send({success: true, message: 'Registro exitoso'});
                    });
                } catch (e) {
                    return res.status(500).send('Error al encriptar la contraseña');
                }
            }
        }
    });
});

app.post('/crearPartido', verificarToken, (req, res) => {
  const { jugadores, fecha, horario } = req.body;
  const ownerId = req.user.id;
  const createTable = `
    CREATE TABLE IF NOT EXISTS partidos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      owner INT NOT NULL,
      jugadores INT NOT NULL,
      fecha DATE NOT NULL,
      hora TIME NOT NULL,
      cancha INT,
      FOREIGN KEY (owner) REFERENCES usuarios(id)
    )
  `;
  db.query(createTable, (err) => {
    if (err) throw err;

    const sqlInsert = 'INSERT INTO partidos (owner, jugadores, fecha, hora) VALUES (?, ?, ?, ?)';
    db.query(sqlInsert, [ownerId, jugadores, fecha, horario], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al crear el partido');
      }
      const id_partido = result.insertId;

      let jugadorFields = '';
      for (let i = 1; i <= jugadores; i++) {
        jugadorFields += `id_jugador${i} INT${i === 1 ? ' NOT NULL' : ''},\n`;
      }

      // Crear tabla plantel con el id correcto
      const createTableTurno = `
        CREATE TABLE IF NOT EXISTS turno(
          id INT AUTO_INCREMENT PRIMARY KEY,
          id_partido INT NOT NULL,
          id_jugador INT NOT NULL,
          id_cancha INT,
          FOREIGN KEY (id_jugador) REFERENCES usuarios(id),
          FOREIGN KEY (id_partido) REFERENCES partidos(id)
        )
      `;
      db.query(createTableTurno, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al crear la tabla de jugadores');
        }

        // Insertar owner en la tabla turno
        const insertOwner = `
          INSERT INTO turno (id_partido, id_jugador) VALUES (?,?)
        `;
        db.query(insertOwner, [id_partido, ownerId], (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error al insertar el owner en la tabla de jugadores');
          }
          res.send({success: true, message: 'Partido y plantel creados exitosamente', id_partido});
        });
      });
    });
  });
});

app.get('/partidosAjenos', verificarToken, (req, res) => {
  const userId = req.user.id;
  db.query('SELECT * FROM partidos WHERE owner != ? AND fecha >= CURDATE();', [userId], async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener los partidos');
    }
    if (!result || result.length === 0) {
      return res.send({ success: true, partidos: [] });
    }  
    const partidosNoFichado = [];
    let pendientes = result.length;
    for (const partido of result) {
      db.query(
        'SELECT 1 FROM turno WHERE id_partido = ? AND id_jugador = ? LIMIT 1',
        [partido.id, userId],
        (err, rows) => {
          if (!err && rows.length === 0) {
            partidosNoFichado.push(partido);
          }
          pendientes--;
          if (pendientes === 0) {
            res.send({ success: true, partidos: partidosNoFichado });
          }
        }
      );
    }
  });
});

app.get('/partidosPropios', verificarToken, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT DISTINCT p.* 
    FROM partidos p
    JOIN turno t ON p.id = t.id_partido
    WHERE t.id_jugador = ? AND p.fecha >= CURDATE()
  `;
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener los partidos');
    }
    if (!result || result.length === 0) {
      return res.send({ success: true, partidos: [] });
    }
    res.send({ success: true, partidos: result });
  });
});

app.get('/partidos', (req, res) => {
  db.query('SELECT * FROM partidos WHERE fecha >= CURDATE();', (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener los partidos');
    }
    if (!result || result.length === 0) {
      return res.send({ success: true, partidos: [] }); // No hay partidos
    }
    console.log('Partidos obtenidos:', result);
    res.send({success: true, partidos: result});
  });
});

app.get('/getOwnerUsername/:id_partido', (req, res) => {
  const id_partido = req.params.id_partido;
  const sql = `
    SELECT u.username 
    FROM usuarios u
    JOIN partidos p ON u.id = p.owner
    WHERE p.id = ?
  `;
  db.query(sql, [id_partido], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener el nombre del owner');
    }
    if (result.length > 0) {
      res.send({success: true, username: result[0].username});
    } else {
      res.send({success: false, message: 'Owner no encontrado'});
    }
  });
});

app.get('/mostrarUser', verificarToken, (req, res) => {
  const userId = req.user.id;
  const sql = 'SELECT * FROM usuarios WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener los datos del usuario');
    }
    if (result.length > 0) {
      res.send({success: true, ...result[0]});
    } else {
      res.send({success: false, message: 'Usuario no encontrado'});
    }
  });
});

app.post('/logout', (req, res) => {
  res.send({success: true, message: 'Logout exitoso'});
});

app.post('/modUser', verificarToken, (req, res) => {
  const {username, password, newPassword} = req.body;
  const userId = req.user.id;
  const sql = 'SELECT * FROM usuarios WHERE id = ?';
  db.query(sql, [userId], async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({success: false, message: 'Error al obtener los datos del usuario'});
    }
    if (result.length === 0) {
      return res.status(404).send({success: false, message: 'Usuario no encontrado'});
    }
    const user = result[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send({ success: false, message: 'Contraseña actual incorrecta' });
    }
    let hashedPassword = user.password;
    if (newPassword && newPassword.length >= 8) {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }
    const updateSql = 'UPDATE usuarios SET username = ?, password = ? WHERE id = ?';
    db.query(updateSql, [username, hashedPassword, userId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send({success: false, message: 'Error al actualizar los datos del usuario'});
      }
      res.send({success: true, message: 'Datos actualizados exitosamente'});
    });
  });
});

app.post('/fichaje', verificarToken, (req, res) => {
  const { id_partido } = req.body;
  const userId = req.user.id;
  db.query('SELECT jugadores FROM partidos WHERE id = ?', [id_partido], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).send({success: false, message: 'Partido no encontrado'});
    }
    let faltantes = result[0].jugadores;
    if(faltantes != 0){
      faltantes --; 
      db.query('UPDATE partidos SET jugadores = ? WHERE id = ?', [faltantes, id_partido],(err, result) => {
        if(err){
          return result.status(500).send({success: false, message: 'Error al modificar la cantidad de jugadores'});
        }
      });
      db.query('INSERT INTO turno (id_partido, id_jugador) VALUES (?, ?)', [id_partido, userId], (err, result) => {
        if(err){
          return result.status(500).send({success: false, message: 'Error al agregar instancia del partido'});
        }
        res.send({success: true, message: 'Fichaje Exitoso'});
      });

    }
    
  });
});

app.post('/eliminarPartido', verificarToken, (req, res) => {
  const { id_partido } = req.body;
  const userId = req.user.id;
  const username = req.user.username;
  db.query('SELECT owner FROM partidos WHERE id = ?', [id_partido], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({success: false, message: 'Error al verificar el owner del partido'});
    }
    // Solo el owner o el admin pueden eliminar
    if (result.length === 0 || (result[0].owner !== userId && username !== 'admin')) {
      return res.status(403).send({success: false, message: 'No tienes permiso para eliminar este partido'});
    }
    db.query('DELETE FROM turno WHERE id_partido = ?', [id_partido], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send({success: false, message: 'Error al eliminar los turnos relacionados'});
      }
      // Ahora sí borra el partido
      db.query('DELETE FROM partidos WHERE id = ?', [id_partido], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send({success: false, message: 'Error al eliminar el partido'});
        }
        res.send({success: true, message: 'Partido eliminado exitosamente'});
      });
    });
  });
});

app.post('/salirPartido', verificarToken, (req, res) => {
  const { id_partido } = req.body;
  const userId = req.user.id;
  db.query('SELECT jugadores FROM partidos WHERE id = ?', [id_partido], (err, result) => {
    if (err || result.length === 0) {
      return res.status(404).send({success: false, message: 'Partido no encontrado'});
    }
    let faltantes = result[0].jugadores;
    faltantes ++; 
      db.query('UPDATE partidos SET jugadores = ? WHERE id = ?', [faltantes, id_partido],(err, res) => {
        if(err){
          return res.status(500).send({success: false, message: 'Error al modificar la cantidad de jugadores'});
        }
      });
      db.query('DELETE FROM turno WHERE id_partido = ? AND id_jugador = ?', [id_partido, userId], (err, result) => {
        if(err){
          return res.status(500).send({success: false, message: 'Error eliminar al jugador'});
        }
          res.send({success: true, message: 'Has salido del partido exitosamente'});
      }) ;
    });
});

app.post('/crearPartidoAdmin', verificarToken, (req, res) => {
  const {username, jugadores, fecha, horario } = req.body;
  db.query('SELECT id FROM usuarios WHERE username = ?', [username], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({success: false, message:'Error al buscar el usuario'});
    }
    if (result.length === 0) {
      return res.status(404).send({success: false, message:'Usuario no encontrado'});
    }
    const owner = result[0].id; // Asignar el ID del usuario encontrado

    const createTable = `
      CREATE TABLE IF NOT EXISTS partidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner INT NOT NULL,
        jugadores INT NOT NULL,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        FOREIGN KEY (owner) REFERENCES usuarios(id)
      )
    `;
    db.query(createTable, (err) => {
      if (err) throw err;

      const sqlInsert = 'INSERT INTO partidos (owner, jugadores, fecha, hora) VALUES (?, ?, ?, ?)';
      db.query(sqlInsert, [owner, jugadores, fecha, horario], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send({success: false, message:'Error al crear el partido'});
        }
        const id_partido = result.insertId;

        // Crear tabla plantel con el id correcto
        const createTableTurno = `
        CREATE TABLE IF NOT EXISTS turno(
          id INT AUTO_INCREMENT PRIMARY KEY,
          id_partido INT NOT NULL,
          id_jugador INT NOT NULL,
          id_cancha INT,
          FOREIGN KEY (id_jugador) REFERENCES usuarios(id),
          FOREIGN KEY (id_partido) REFERENCES partidos(id)
        )`;
        db.query(createTableTurno, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error al crear la tabla de jugadores');
          }

          // Insertar owner en la tabla turno
          const insertOwner = `INSERT INTO turno (id_partido, id_jugador) VALUES (?,?)`;
          db.query(insertOwner, [id_partido, owner], (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send('Error al insertar el owner en la tabla de jugadores');
            }
            res.send({success: true, message: 'Partido y plantel creados exitosamente', id_partido});
          });
        });
      });
    });
  });
});

app.post('/modificarPartido', verificarToken, (req, res) => {
  const { id_partido, fecha, horario, jugadores } = req.body;
  const sql = 'UPDATE partidos SET fecha = ?, hora = ?, jugadores = ? WHERE id = ?';
  db.query(sql, [fecha, horario, jugadores, id_partido], (err, result) => {
    if(err){
      return res.status(500).send({success: false, message:'Error al modificar el partido'});
    }else{
      res.send({success: true, message: 'Partido Modificado Exitosamente', id_partido});
    }
  });
});

app.get('/cargarUsers', verificarToken, (req, res) => {
  db.query('SELECT * FROM usuarios;', (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener los usuarios');
    }
    if (!result || result.length === 0) {
      return res.send({ success: true, usuarios: [] }); // No hay partidos
    }
    console.log('Partidos obtenidos:', result);
    res.send({success: true, usuarios: result});
  });
});

app.post('/modificarUserAdmin', verificarToken, (req, res) => {
  const {user, name, lastname, birthdate, email} = req.body;
  const sql = 'UPDATE usuarios SET username = ?, name = ?, lastname = ?, birthdate = ?, email = ? WHERE username = ?';
  db.query(sql, [user, name, lastname, birthdate, email, user], (err, result)=> {
    if(err){
      return res.status(500).send({success: false, message:'Error al modificar el usuario'});
    }else{
      return res.send({success: true, message: 'Usuario Modificado Exitosamente'});
    }
  });
});

app.post('/eliminarUser', verificarToken, (req, res) => {
  const {id} = req.body; 
  const sql = 'DELETE FROM usuarios WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ success: false, message: 'Error al eliminar el usuario' });
    }else{
      return res.send({ success: true, message: 'Usuario eliminado exitosamente' });
    }
  });
});

app.get('/cantUsuarios', (req, res) => {
  db.query("SELECT COUNT(*) AS cantidad FROM usuarios WHERE username != 'admin'", (err, result) => {
    if (err) {
      return res.status(500).send({success: false, message: 'Error al contar usuarios'});
    }
    res.send({success: true, cantidad: result[0].cantidad});
  });
});

// Contar partidos
app.get('/cantPartidos', (req, res) => {
  db.query('SELECT COUNT(*) AS cantidad FROM partidos', (err, result) => {
    if (err) {
      return res.status(500).send({success: false, message: 'Error al contar partidos'});
    }
    res.send({success: true, cantidad: result[0].cantidad});
  });
});

app.post('/confirmarPartido', verificarToken, (req, res) => {
  const { id_partido, cancha } = req.body;
  const sql = 'UPDATE partidos SET cancha = ? WHERE id = ?';
  db.query(sql, [cancha, id_partido], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ success: false, message: 'Error al confirmar el partido' });
    }
    res.send({ success: true, message: 'Partido confirmado y cancha asignada' });
  });
});