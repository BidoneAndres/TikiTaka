let userLoggedIn;
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
    userLoggedIn = data.username; // Guarda el nombre de usuario del usuario logueado
    if (data.success) {
        if( userLoggedIn === 'admin') {
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
    const jugadores = document.getElementById('jugadores').value;

    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none'; // Oculta el mensaje antes de enviar
    msgDiv.className = "";

    const res = await fetch('http://localhost:3000/crearPartido', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fecha, horario, jugadores })
    });

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
        const res = await fetch('http://localhost:3000/partidosAjenos');
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
    
    const resJugadores = await fetch(`http://localhost:3000/getEspaciosDisponibles/${partido.id}`);
    const dataJugadores = await resJugadores.json();
    const cantJugadores = 14 - partido.jugadores + dataJugadores.inscriptos;
    card.innerHTML += `
        <div class="card" style="width: 18rem;">
            <img src="./img/Cómo-hacer-una-cancha-de-fútbol.jpg" class="card-img-top" alt="...">
            <div class="card-body">
            <form id="fichajeForm" onsubmit="fichaje(${partido.id}); return false;">
                <input type="hidden" id="id_partido" value="${partido.id}">
                <h5 class="card-title">${username}</h5>
                <p class="card-text">Jugadores: ${cantJugadores}/14</p>
                <p class="card-text">Dia: ${partido.fecha}</p>
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
        const userRes = await fetch('http://localhost:3000/mostrarUser');
        const userData = await userRes.json();
        if (!userData.success) {
            partidosList.innerHTML = '<p style="color:#edcd3d;">Error al obtener usuario logueado.</p>';
            return;
        }
        const userLoggedInId = userData.id;

        const res = await fetch('http://localhost:3000/partidosPropios');
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
            const resJugadores = await fetch(`http://localhost:3000/getEspaciosDisponibles/${partido.id}`);
            const dataJugadores = await resJugadores.json();
            const cantJugadores = 14 - partido.jugadores + dataJugadores.inscriptos;
            let botones = '';
            if (partido.owner === userLoggedInId) {
                botones = `
                    <button class="btn btn-editar btn-sm" onclick="modificarPartido(${partido.id})">Editar</button>
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
                        <p class="card-text">Jugadores: ${cantJugadores}/14</p>
                        <p class="card-text">Dia: ${partido.fecha}</p>
                        <p class="card-text">Hora: ${partido.hora}</p>
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
    const resJugadores = await fetch(`http://localhost:3000/getEspaciosDisponibles/${partido.id}`);
    const dataJugadores = await resJugadores.json();
    const cantJugadores = 14 - partido.jugadores + dataJugadores.inscriptos;
    card.innerHTML += `
        <div class="card" style="width: 18rem;">
            <img src="./img/Cómo-hacer-una-cancha-de-fútbol.jpg" class="card-img-top" alt="...">
            <div class="card-body">
            <form id="fichajeForm" onsubmit="fichaje(${partido.id}); return false;">
                <input type="hidden" id="id_partido" value="${partido.id}">
                <h5 class="card-title">${username}</h5>
                <p class="card-text">Jugadores: ${cantJugadores}/14</p>
                <p class="card-text">Dia: ${partido.fecha}</p>
                <p class="card-text">Hora: ${partido.hora}</p>
                <button class="btn btn-editar btn-sm" onclick="modificarPartido(${partido.id})">Editar</button>
                <button class="btn btn-eliminar btn-sm" onclick="eliminarPartido(${partido.id})">Eliminar</button>
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

async function cargarUser(){
    
    const res = await fetch('http://localhost:3000/mostrarUser');
    const data = await res.json();
    if (!data.success) {
        console.error('Error al obtener los datos del usuario:', data.message);
        return;
    }else{
        document.getElementById('email').value = data.email;
        document.getElementById('username').value = data.username;
    }
}

async function logout() {
    const res = await fetch('http://localhost:3000/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const data = await res.json();
    if (data.success) {
        window.location.href = 'login.html';
    } else {
        console.error('Error al cerrar sesión:', data.message);
    }
}

async function modUser(){
    const username = document.getElementById('username').value;
    const password = document.getElementById('contrasena').value;
    const newPassword = document.getElementById('newContrasena').value;
    msgDiv = document.getElementById('message');

    const res = await fetch('http://localhost:3000/modUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, newPassword })
    });
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
    const res = await fetch('http://localhost:3000/fichaje', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_partido })
    });
    data = await res.json();
    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'block';
    if (data.success) {
        msgDiv.className = "alert alert-success d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de éxito
        msgDiv.innerText = data.message;
        setTimeout(() => {
            window.location.href = 'misPartidos.html';
        }, 2000); // Redirige después de 2 segundos
    } else {
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}

async function modificarPartido(id_partido) {
    const fecha = document.getElementById('fecha').value;
    const horario = document.getElementById('horario').value;
    const jugadores = document.getElementById('jugadores').value;

    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none'; // Oculta el mensaje antes de enviar
    msgDiv.className = "";

    const res = await fetch('http://localhost:3000/modificarPartido', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_partido, fecha, horario, jugadores })
    });

    const data = await res.json();
    if (data.success) {
        window.location.href = 'partidosUsuario.html';
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}

async function eliminarPartido(id_partido) {
    console.log('Botón eliminar presionado. ID partido:', id_partido);
    const msgDiv = document.getElementById('message');
    msgDiv.style.display = 'none'; // Oculta el mensaje antes de enviar
    msgDiv.className = "";

    const res = await fetch('http://localhost:3000/eliminarPartido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_partido })
    });

    const data = await res.json();
    if (data.success) {
        window.location.href = 'partidosUsuario.html';
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
    const res = await fetch('http://localhost:3000/salirPartido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_partido })
    });
    const data = await res.json();
    if (data.success) {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-success d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de éxito
        msgDiv.innerText = data.message;
        setTimeout(() => {
            window.location.href = 'partidosUsuario.html';
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

    const res = await fetch('http://localhost:3000/crearPartidoAdmin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, fecha, horario, jugadores })
    });

    const data = await res.json();
    if (data.success) {
        window.location.href = 'partidos(admin).html';
    } else {
        msgDiv.style.display = 'block';
        msgDiv.className = "alert alert-warning d-flex align-items-center text-center"; // Cambia la clase para aplicar estilos de error
        msgDiv.innerText = data.message;
    }
}
window.eliminarPartido = eliminarPartido;
window.salirPartido = salirPartido;