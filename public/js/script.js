let usernamelog='';

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none'; // Oculta el mensaje antes de enviar
    msgDiv.className = "";

    const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    usernamelog = data.username; // Guarda el nombre de usuario del usuario logueado
    console.log(usernamelog);
    if (data.success) {
        localStorage.setItem('token', data.token);
        if( usernamelog === 'admin') {
            window.location.href = 'Dashboard(admin).html';
        }else{
            window.location.href = 'partidosUsuario.html';
        }
        
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}

async function register() {


    const username = document.getElementById('username').value;
    const name = document.getElementById('name').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const birthdate = document.getElementById('birthdate').value;
    const password = document.getElementById('password').value;
    const repPassword = document.getElementById('repPassword').value;

    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none'; // Oculta el mensaje antes de enviar
    msgDiv.className = "";

    const res = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, name, lastname, email, birthdate, password, repPassword }) // <-- repPassword corregido
    });
    
    const data = await res.json();

    if (data.success) {
        window.location.href = 'login.html';
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}

async function crearPartido() {
    const fecha = document.getElementById('fecha').value;
    const horario = document.getElementById('horario').value;
    let jugadores = parseInt(document.getElementById('jugadores').value, 10);

    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none'; // Oculta el mensaje antes de enviar
    msgDiv.className = "";

    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/crearPartido', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ fecha, horario, jugadores })
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html';
        return;
    }
    const data = await res.json();
    if (data.success) {
        window.location.href = 'partidosUsuario.html';
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}

async function partidosAjenos(){
    const partidosList = document.getElementById('partidosList');
    partidosList.innerHTML = '<p style="color:#edcd3d;">Cargando Partidos...</p>';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/partidosAjenos', {
            headers: {
            'Authorization': 'Bearer ' + token
            }
        });
        if (res.status === 401 || res.status === 403) {
            window.location.href = 'login.html';
            return;
        }
        const data = await res.json();
        // CORRIGE ESTA CONDICIÓN:
            if (!data.success || !data.partidos || data.partidos.length === 0) {
                partidosList.innerHTML = '<p style="color:#edcd3d;">No hay partidos.</p>';
                return;
            }

            partidosList.innerHTML = '';
            for (const partido of data.partidos) {
                const resUsername = await fetch(`http://localhost:3000/getOwnerUsername/${partido.id}`);
            const dataUsername = await resUsername.json();
            if (!dataUsername.success) {
                partidosList.innerHTML = '<p style="color:#edcd3d;">Error al cargar el nombre de usuario.</p>';
                return;
            }
            const username = dataUsername.username;
            const card = document.createElement('div');
            card.className="m-3";
            card.innerHTML += `
                <div class="card" style="width: 18rem;">
                    <img src="./img/Cómo-hacer-una-cancha-de-fútbol.jpg" class="card-img-top" alt="...">
                    <div class="card-body">
                        <form id="fichajeForm" onsubmit="fichaje(${partido.id}); return false;">
                            <input type="hidden" id="id_partido" value="${partido.id}">
                            <h5 class="card-title">${username}</h5>
                            <p class="card-text">Jugadores: ${14-partido.jugadores}/14</p>
                            <p class="card-text">Dia: ${formatearFecha(partido.fecha)}</p>
                            <p class="card-text">Hora: ${partido.hora}</p>
                            <button type="submit" class="btn btn-primary">Entrar</button>
                        </form>
                    </div>
                </div>`;
            partidosList.appendChild(card);
        }
    } catch (error) {
        console.error('Error al cargar los partidos:', error);
        partidosList.innerHTML = '<p style="color:#edcd3d;">Error al cargar los partidos</p>';
    }
}

async function partidosUsuario(){
    const partidosList = document.getElementById('partidosList');
    partidosList.innerHTML = '<p style="color:#edcd3d;">Cargando Partidos...</p>';

    try {
        // Obtén el id del usuario logueado
        const token = localStorage.getItem('token');
        const userRes = await fetch('http://localhost:3000/mostrarUser', {
            headers: { 'Authorization': 'Bearer ' + token }
        }); 
        if (userRes.status === 401 || userRes.status === 403) {
            window.location.href = 'login.html';
            return;
        }
        const userData = await userRes.json();
        if (!userData.success) {
            partidosList.innerHTML = '<p style="color:#edcd3d;">Error al obtener usuario logueado.</p>';
            return;
        }
        const userLoggedInId = userData.id;

        const res = await fetch('http://localhost:3000/partidosPropios', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.status === 401 || res.status === 403) {
            window.location.href = 'login.html';
            return;
        }
        const data = await res.json();
        if (!data.success || !data.partidos || data.partidos.length === 0) {
            partidosList.innerHTML = '<p style="color:#edcd3d;">No hay partidos.</p>';
            return;
        }

        partidosList.innerHTML = '';
        for (const partido of data.partidos) {
            const resUsername = await fetch(`http://localhost:3000/getOwnerUsername/${partido.id}`);
            const dataUsername = await resUsername.json();
            if (!dataUsername.success) {
                partidosList.innerHTML = '<p style="color:#edcd3d;">Error al cargar el nombre de usuario.</p>';
                return;
            }
            const username = dataUsername.username;
            const card = document.createElement('div');
            card.className="m-3";
            let botones = '';
            if (partido.owner === userLoggedInId) {
                botones = `
                    <button type="button" class="btn btn-editar btn-sm" data-bs-toggle="modal" data-bs-target="#editarModal" onclick="abrirEditarPartido(${partido.id}, '${partido.fecha}', '${partido.hora}', ${partido.jugadores})">Editar</button>
                    <button class="btn btn-eliminar btn-sm" onclick="eliminarPartido(${partido.id})">Eliminar</button>
                `;
            } else {
                botones = `
                    <button class="btn btn-secondary m-1" onclick="salirPartido(${partido.id})">Salir</button>
                `;
            }

            card.innerHTML += `
                <div class="card" style="width: 18rem;">
                    <img src="./img/Cómo-hacer-una-cancha-de-fútbol.jpg" class="card-img-top" alt="...">
                    <div class="card-body">
                        <h5 class="card-title">${username}</h5>
                        <p class="card-text">Jugadores: ${14-partido.jugadores}/14</p>
                        <p class="card-text">Dia: ${formatearFecha(partido.fecha)}</p>
                        <p class="card-text">Hora: ${partido.hora}</p>
                        <p class="card-text">Cancha: ${partido.cancha}</p>
                        ${botones}
                    </div>
                </div>`;
            partidosList.appendChild(card);
        }
    } catch (error) {
        console.error('Error al cargar los partidos:', error);
        partidosList.innerHTML = '<p style="color:#edcd3d;">Error al cargar los partidos</p>';
    }
}

async function mostrarPartidos(){
    const partidosList = document.getElementById('partidosList');
    partidosList.innerHTML = '<p style="color:#edcd3d;">Cargando Partidos...</p>';

    try {
        const res = await fetch('http://localhost:3000/partidos');
        const data = await res.json();
        // CORRIGE ESTA CONDICIÓN:
        if (!data.success || !data.partidos || data.partidos.length === 0) {
            partidosList.innerHTML = '<p style="color:#edcd3d;">No hay partidos.</p>';
            return;
        }

        partidosList.innerHTML = '';
        for (const partido of data.partidos) {
            const resUsername = await fetch(`http://localhost:3000/getOwnerUsername/${partido.id}`);
            const dataUsername = await resUsername.json();
            if (!dataUsername.success) {
                partidosList.innerHTML = '<p style="color:#edcd3d;">Error al cargar el nombre de usuario.</p>';
                return;
            }
            const username = dataUsername.username;
            const card = document.createElement('div');
            card.className="m-3";
            card.innerHTML += `
                <div class="card" style="width: 18rem;">
                    <img src="./img/Cómo-hacer-una-cancha-de-fútbol.jpg" class="card-img-top" alt="...">
                    <div class="card-body">
                        <form id="fichajeForm">
                            <input type="hidden" id="id_partido" value="${partido.id}">
                            <h5 class="card-title">${username}</h5>
                            <p class="card-text">Jugadores: ${14-partido.jugadores}/14</p>
                            <p class="card-text">Dia: ${formatearFecha(partido.fecha)}</p>
                            <p class="card-text">Hora: ${partido.hora}</p>
                            <p class="card-text">Hora: ${partido.cancha}</p>
                            <button type="button" class="btn btn-editar btn-sm" data-bs-toggle="modal" data-bs-target="#editarModal" onclick="abrirEditarPartido(${partido.id}, '${partido.fecha}', '${partido.hora}', ${partido.jugadores})">Editar</button>
                            <button class="btn btn-eliminar btn-sm" onclick="eliminarPartido(${partido.id})">Eliminar</button>
                            <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#modalConfirmarCancha" onclick="abrirConfirmarCancha(${partido.id})"> Confirmar </button>
                        </form>
                    </div>
                </div>`;
            partidosList.appendChild(card);
        }
    } catch (error) {
        console.error('Error al cargar los partidos:', error);
        partidosList.innerHTML = '<p style="color:#edcd3d;">Error al cargar los partidos</p>';
    }
}

function abrirEditarPartido(id, fecha, hora, jugadores) {
    // Llenar los campos del modal con los datos del partido
    document.querySelector('#editarModal #jugadores').value = jugadores;
    document.querySelector('#editarModal #fecha').value = fecha;
    document.querySelector('#editarModal #horario').value = hora;
    // Guarda el id en un atributo del modal para usarlo luego
    document.getElementById('editarModal').setAttribute('data-id', id);
}

async function cargarUser(){
    
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/mostrarUser', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html';
        return;
    }
    const data = await res.json();
    if (!data.success) {
        console.error('Error al obtener los datos del usuario:', data.message);
        return;
    }else{
        document.getElementById('email').value = data.email;
        document.getElementById('username').value = data.username;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

async function modUser(){
    const username = document.getElementById('username').value;
    const password = document.getElementById('contrasena').value;
    const newPassword = document.getElementById('newContrasena').value;
    msgDiv = document.getElementById('message');

    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/modUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ username, password, newPassword })
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html';
        return;
    }
    const data = await res.json();
    if (data.success) {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
        setTimeout(() => {
            logout();
        }, 3000); 
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}

async function fichaje(id_partido){
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/fichaje', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ id_partido })
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html';
        return;
    }
    data = await res.json();
    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'block';
    if (data.success) {
        msgDiv.className = "alert alert-success d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de éxito
        msgDiv.innerText = data.message;
        setTimeout(() => {
            window.location.reload();
        }, 2000); // Redirige después de 2 segundos
    } else {
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}

async function modificarPartido() {
    const id_partido = document.getElementById('editarModal').getAttribute('data-id');
    const fecha = document.querySelector('#editarModal #fecha').value;
    const horario = document.querySelector('#editarModal #horario').value;
    const jugadores = document.querySelector('#editarModal #jugadores').value;

    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none';
    msgDiv.className = "";

    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/modificarPartido', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ id_partido, fecha, horario, jugadores })
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html';
        return;
    }

    const data = await res.json();
    if (data.success) {
        window.location.reload();
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center";
        msgDiv.innerText = data.message;
    }
}

async function eliminarPartido(id_partido) {
    console.log('Botón eliminar presionado. ID partido:', id_partido);
    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none'; // Oculta el mensaje antes de enviar
    msgDiv.className = "";

    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/eliminarPartido', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ id_partido, usernamelog })
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html';
        return;
    }

    const data = await res.json();
    if (data.success) {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-success d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de éxito
        msgDiv.innerText = data.message;
        setTimeout(() => {
        window.location.reload(); 
        }, 1000);// Recarga la página para reflejar los cambios
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}

async function salirPartido(id_partido) {

    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none'; // Oculta el mensaje antes de enviar
    msgDiv.className = "";
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/salirPartido', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ id_partido })
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html';
        return;
    }
    const data = await res.json();
    if (data.success) {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-success d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de éxito
        msgDiv.innerText = data.message;
        setTimeout(() => {
            window.location.reload();
        }, 2000); // Redirige después de 2 segundos
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}

async function crearPartidoAdmin() {
    const username = document.getElementById('username').value;
    const fecha = document.getElementById('fecha').value;
    const horario = document.getElementById('horario').value;
    const jugadores = document.getElementById('jugadores').value;

    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none'; // Oculta el mensaje antes de enviar
    msgDiv.className = "";

    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/crearPartidoAdmin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ username, fecha, horario, jugadores })
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html';
        return;
    }
    const data = await res.json();
    if (data.success) {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
        setTimeout(() => {
            window.location.href = 'Partidos(admin).html';
    }, 1000);
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}

async function cargarUsers(){
    const usuariosList = document.getElementById('usuarios');

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/cargarUsers', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!data.success || !data.usuarios || data.usuarios.length === 0) {
            usuariosList.innerHTML = '<p style="color:#edcd3d;">No hay Usuarios.</p>';
            return;
        }
        if (res.status === 401 || res.status === 403) {
            window.location.href = 'login.html';
            return;
        }
        usuariosList.innerHTML = '';
        for (const usuario of data.usuarios) {
            const card = document.createElement('tr');
            card.innerHTML += `
            <td>${usuario.username}</td>
            <td>${usuario.name}</td>
            <td>${usuario.lastname}</td>
            <td>${formatearFecha(usuario.birthdate)}</td>
            <td>${usuario.email}</td>
            <td>
             <button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#modalEditar"
                onclick="cargarDatosEditar('${usuario.username}', '${usuario.name}', '${usuario.lastname}', '${usuario.birthdate}', '${usuario.email}')">Editar</button>
            <button class="btn btn-danger btn-sm" data-bs-toggle="modal" data-bs-target="#modalEliminar"
                onclick="prepararEliminarUser(${usuario.id}, '${usuario.username}')">Eliminar</button>
            </td>
                `;
            usuariosList.appendChild(card);
        }
    } catch (error) {
        console.error('Error al cargar los partidos:', error);
        usuariosList.innerHTML = '<p style="color:#edcd3d;">Error al cargar los partidos</p>';
    }
}

let idUsuarioAEliminar = null;

function prepararEliminarUser(id, username) {
    idUsuarioAEliminar = id;
    document.getElementById('usuarioEliminar').innerText = username;
}

function confirmarEliminarUser() {
    if (idUsuarioAEliminar !== null) {
        eliminarUser(idUsuarioAEliminar);
        idUsuarioAEliminar = null;
    }
}

async function modificarUser() {

    const user = document.getElementById('user').value;
    const name = document.getElementById('name').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const birthdate = document.getElementById('birthdate').value;

    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none'; // Oculta el mensaje antes de enviar
    msgDiv.className = "";

    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/modificarUserAdmin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ user, name, lastname, email, birthdate })
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html';
        return;
    }
    const data = await res.json();
    if (data.success) {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-success d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de éxito
        msgDiv.innerText = data.message;
        setTimeout(() => {
            msgDiv.style.display = 'block';
            msgDiv.className = "alert alert-warning d-flex align-items-center text-center";
            msgDiv.innerText = data.message;
            window.location.reload();
        }, 1000); 
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}

async function eliminarUser(id){

    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none'; // Oculta el mensaje antes de enviar
    msgDiv.className = "";

    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/eliminarUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-success d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de éxito
        msgDiv.innerText = data.message;
        setTimeout(() => {
            msgDiv.style.display = 'block';
            msgDiv.className = "alert alert-warning d-flex align-items-center text-center";
            msgDiv.innerText = data.message;
            window.location.reload();
        }, 1000); 
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }

}

async function cargarDatos(){
    const resUsuarios = await fetch('http://localhost:3000/cantUsuarios');
    const dataUsuarios = await resUsuarios.json();
    if (dataUsuarios.success) {
        document.getElementById('cantJugadores').innerText = dataUsuarios.cantidad;
    } else {
        document.getElementById('cantJugadores').innerText = 'Error';
    }

    const resPartidos = await fetch('http://localhost:3000/cantPartidos');
    const dataPartidos = await resPartidos.json();
    if (dataPartidos.success) {
        document.getElementById('cantPartidos').innerText = dataPartidos.cantidad;
    } else {
        document.getElementById('cantPartidos').innerText = 'Error';
    }
}

async function crearUserAdmin(){
    const username = document.getElementById('nuevoUsername').value;
    const name = document.getElementById('nuevoName').value;
    const lastname = document.getElementById('nuevoLastname').value;
    const birthdate = document.getElementById('nuevoBirthdate').value;
    const email = document.getElementById('nuevoEmail').value;
    const password = document.getElementById('nuevoPassword').value;
    const repPassword = document.getElementById('nuevoRepPassword').value;

    const res = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name, lastname, birthdate, email, password, repPassword })
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = 'login.html';
        return;
    }
    const data = await res.json();
    const msgDiv = document.getElementById('message');
    if (data.success) {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-success d-flex align-items-center text-center";
        msgDiv.innerText = data.message;
        setTimeout(() => { window.location.reload(); }, 1000);
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center";
        msgDiv.innerText = data.message;
    }
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = String(fecha.getFullYear()).slice(-2);
    return `${dia}/${mes}/${anio}`;
}

function abrirConfirmarCancha(idPartido) {
    document.getElementById('partidoAConfirmar').value = idPartido;
}

document.getElementById('formConfirmarCancha').addEventListener('submit', async function(event) {
    event.preventDefault();
    const idPartido = document.getElementById('partidoAConfirmar').value;
    const numeroCancha = document.getElementById('numeroCancha').value;

    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/confirmarPartido', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ id_partido: idPartido, cancha: numeroCancha })
    });
    const data = await res.json();
    if (data.success) {
        window.location.reload();
    } else {
        alert(data.message || 'Error al confirmar partido');
    }
});
window.eliminarPartido = eliminarPartido;
window.salirPartido = salirPartido;
window.crearPartidoAdmin = crearPartidoAdmin;
window.modificarPartido = modificarPartido;
window.fichaje = fichaje;
window.crearPartido = crearPartido;