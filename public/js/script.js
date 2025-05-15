async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
        // Si el login es exitoso, redirigir a la página de inicio
        window.location.href = 'public/Pantalla1.html';
    } else {
        // Si el login falla, mostrar el mensaje de error
        document.getElementById('message').innerText = data.message;
    }
    document.getElementById('message').innerText = data.message;
}

async function register() {


    const username = document.getElementById('username').value;
    const name = document.getElementById('name').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const birthdate = document.getElementById('birthdate').value;
    const password = document.getElementById('password').value;
    const repPassword = document.getElementById('repPassword').value;

    const res = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, name, lastname, email, birthdate, password, repPassword }) // <-- repPassword corregido
    });

    const data = await res.json();
    document.getElementById('message').innerText = data.message;
}