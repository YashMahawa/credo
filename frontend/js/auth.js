const API_URL = 'http://localhost:3000/api';

console.log('Auth.js loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth');

    const loginForm = document.getElementById('login');
    const registerForm = document.getElementById('register');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    console.log('Elements found:', {
        loginForm: !!loginForm,
        registerForm: !!registerForm,
        showRegisterLink: !!showRegisterLink,
        showLoginLink: !!showLoginLink
    });

    // Toggle between login and register forms
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', () => {
            console.log('Show register clicked');
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', () => {
            console.log('Show login clicked');
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });
    }

    // Register Event
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Register form submitted');
            
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            const phone_number = document.getElementById('register-phone').value;
            const roll_number = document.getElementById('register-roll').value;

            console.log('Registering user:', username);

            try {
                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, phone_number, roll_number })
                });
                const data = await res.json();
                console.log('Register response:', data);
                
                if (res.ok) {
                    alert('Registration successful! Please log in.');
                    showLoginLink.click(); // Switch to login form
                } else {
                    throw new Error(data.msg || 'Registration failed');
                }
            } catch (err) {
                console.error('Register error:', err);
                alert(err.message);
            }
        });
    }

    // Login Event
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted');
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            console.log('Logging in user:', username);

            try {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                console.log('Login response status:', res.status);
                const data = await res.json();
                console.log('Login response data:', data);
                
                if (res.ok) {
                    localStorage.setItem('token', data.token); // Store the token
                    console.log('Token stored, redirecting to dashboard');
                    window.location.href = 'dashboard.html'; // Redirect to dashboard
                } else {
                    throw new Error(data.msg || 'Login failed');
                }
            } catch (err) {
                console.error('Login error:', err);
                alert(err.message);
            }
        });
    } else {
        console.error('Login form not found!');
    }
});
