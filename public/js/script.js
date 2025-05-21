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

    if (data.success) {
        window.location.href = 'partidosUsuario.html';
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
    const jugadores = document.getElementById('Jugadores').value;

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

async function mostrarPartidos(){
    const partidosList = document.getElementById('partidosList');
    partidosList.innerHTML = '<p style="color:#edcd3d;">Cargando Partidos...</p>';

    try {
        const res = await fetch('http://localhost:3000/mostrarPartidos');
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
    const cantJugadores = 14 - partido.jugadores;
    card.innerHTML += `
        <div class="card m-3 p-0" style="width: 18rem;">
            <img src="./img/Cómo-hacer-una-cancha-de-fútbol.jpg" class="card-img-top" alt="...">
            <div class="card-body">
                <h5 class="card-title">${username}</h5>
                <p class="card-text">Jugadores: ${cantJugadores}/14</p>
                <p class="card-text">Dia: ${partido.fecha}</p>
                <p class="card-text">Hora: ${partido.hora}</p>
                <a href="#" class="btn btn-primary">A jugar!</a>
            </div>
        </div>`;
    partidosList.appendChild(card);
}
    } catch (error) {
        console.error('Error al cargar los partidos:', error);
        partidosList.innerHTML = '<p style="color:#edcd3d;">Error al cargar los partidos</p>';
    }
}