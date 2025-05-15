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
  tempDb.query('CREATE DATABASE IF NOT EXISTS tikitaka', (err, result) => {
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
        db.query(createTableQuery, (err, result) => {
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

app.post('/login', (req, res) => {
    const {username, password} = req.body; //extraer el email y password del body de la peticion

    //consulta a la base de datos para verificar si el usuario existe
    const sql = 'SELECT * FROM usuarios WHERE username = ? AND password = ?';

    db.query(sql, [username, password], (err, result) => {
        if (err){

            return res.status(500).send('Error en la conexion');

        } 
        if(result.length > 0) {
            res.send({successs: true, message: 'Login exitoso'}); //si el usuario existe, enviar un mensaje de exito y el usuario
        } else {
            res.send({success: false, message: 'Usuario o contraseña incorrectos'}); //si el usuario no existe, enviar un mensaje de error
        }
    });
});

//Ruta para el registro de usuarios
app.post('/register', (req, res) => {
    const { username, name, lastname, email, birthdate, password, repPassword } = req.body; //extraer el email y password del body de la peticion

    //verificar si el usuario ya existe
    const sql = 'SELECT * FROM usuarios WHERE username = ? OR email = ?';
    db.query(sql, [username, email], (err, result) => {
        if (err) return res.status(500).send('user o mail en uso'); //si hay un error en la consulta, enviar un error 500
        if(result.length > 0) {
            return res.send({success: false, message: 'El usuario o email ya estan en uso'}); //si el usuario ya existe, enviar un mensaje de error
        } else {
            //verificar el largo de la contraseña
            if(password.length < 8) {
                return res.send({success: false, message: 'La contraseña debe tener al menos 8 caracteres'}); //si la contraseña es menor a 8 caracteres, enviar un mensaje de error
            }
            //verificar si las contraseñas coinciden
            if(password !== repPassword) {
                return res.send({success: false, message: 'Las contraseñas no coinciden'}); //si las contraseñas no coinciden, enviar un mensaje de error
            }else{
                //insertar el nuevo usuario en la base de datos 
                const sql = 'INSERT INTO usuarios (username, name, lastname, birthdate, email, password) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(sql, [username, name, lastname, birthdate, email, password], (err, result) => {
                if (err) return res.status(500).send('error en la carga de los datos'); //si hay un error en la consulta, enviar un error 500
                //si el registro es exitoso, enviar un mensaje de exito
                res.redirect('/login'); //redireccionar a la pagina de inicio
            });
            }
        }
    });
});