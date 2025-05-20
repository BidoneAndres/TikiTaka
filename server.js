//librerias
const express = require('express'); //framework para crear el servidor
const mysql = require('mysql'); //libreria para conectarse a la base de datos
const bodyParser = require('body-parser'); //libreria para parsear el body de las peticiones
const cors = require('cors'); //libreria para permitir peticiones de otros dominios

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
                userLoggedIn = result[0].id // Guardar el ID del usuario logueado
                res.send({success: true, message: 'Login exitoso'});
                console.log(userLoggedIn);
            } else {
                res.send({success: false, message: 'Usuario o contraseña incorrectos'});
            }
        } else {
            res.send({success: false, message: 'Usuario o contraseña incorrectos'});
        }
    });
});

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

app.post('/crearPartido', (req, res) => {
  const { jugadores, fecha, horario } = req.body;
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

    const plantel = [userLoggedIn];
    const sqlInsert = 'INSERT INTO partidos (owner, jugadores, fecha, hora) VALUES (?, ?, ?, ?)';
    db.query(sqlInsert, [userLoggedIn, jugadores, fecha, horario], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al crear el partido');
      }
      const id_partido = result.insertId;

      // Crear tabla plantel con el id correcto
      const createTablePlantel = `
        CREATE TABLE IF NOT EXISTS plantel_${id_partido} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          id_partido INT NOT NULL,
          plantel VARCHAR(255) NOT NULL,
          FOREIGN KEY (id_partido) REFERENCES partidos(id)
        )
      `;
      db.query(createTablePlantel, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error al crear la tabla de jugadores');
        }

        // Insertar owner en la tabla plantel
        const insertOwner = `
          INSERT INTO plantel_${id_partido} (id_partido, plantel) VALUES (?,?)
        `;
        db.query(insertOwner, [id_partido, plantel], (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error al insertar el owner en la tabla de jugadores');
          }
          // Solo aquí respondemos al cliente
          res.send({success: true, message: 'Partido y plantel creados exitosamente', id_partido});
        });
      });
    });
  });
});