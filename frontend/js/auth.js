const API_URL = 'http://localhost:3000/api';

const loginForm = document.getElementById('login');
const registerForm = document.getElementById('register');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

// Toggle between login and register forms
showRegisterLink.addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
});

showLoginLink.addEventListener('click', () => {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
});

// Register Event
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const phone_number = document.getElementById('register-phone').value;
    const roll_number = document.getElementById('register-roll').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, phone_number, roll_number })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Registration successful! Please log in.');
            showLoginLink.click(); // Switch to login form
        } else {
            throw new Error(data.msg || 'Registration failed');
        }
    } catch (err) {
        alert(err.message);
    }
});

// Login Event
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token); // Store the token
            window.location.href = 'dashboard.html'; // Redirect to dashboard
        } else {
            throw new Error(data.msg || 'Login failed');
        }
    } catch (err) {
        alert(err.message);
    }
});
