const API_URL = 'http://localhost:3000/api';

console.log('Auth.js loaded');

// Time synchronization
let timeOffset = 0;

// Function to get synchronized current time
function getCurrentTime() {
    return new Date(Date.now() + timeOffset);
}

// Function to synchronize time with server
async function syncTimeWithServer() {
    try {
        const response = await fetch('http://localhost:3000/api/time');
        const data = await response.json();
        const serverTime = new Date(data.serverTime).getTime();
        const clientTime = Date.now();
        timeOffset = serverTime - clientTime;
        console.log(`Time synchronized. Offset: ${timeOffset}ms`);
    } catch (error) {
        console.error('Failed to sync time with server:', error);
        timeOffset = 0;
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing auth');
    
    // Sync time with server
    await syncTimeWithServer();

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

    // Phone number input validation - only allow digits
    const phoneInput = document.getElementById('register-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            // Remove any non-digit characters
            e.target.value = e.target.value.replace(/\D/g, '');
            // Limit to 10 digits
            if (e.target.value.length > 10) {
                e.target.value = e.target.value.slice(0, 10);
            }
        });
        
        phoneInput.addEventListener('keypress', (e) => {
            // Prevent non-digit input
            if (!/\d/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                e.preventDefault();
            }
            // Prevent input if already 10 digits
            if (e.target.value.length >= 10 && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                e.preventDefault();
            }
        });
    }

    // Register Event
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Register form submitted');
            
            const username = document.getElementById('register-username').value.trim();
            const password = document.getElementById('register-password').value;
            const phone_number = document.getElementById('register-phone').value.trim();
            const roll_number = document.getElementById('register-roll').value.trim();

            // Validate phone number is exactly 10 digits
            if (phone_number.length !== 10) {
                alert('Phone number must be exactly 10 digits');
                return;
            }

            // Validate phone number contains only digits
            if (!/^\d{10}$/.test(phone_number)) {
                alert('Phone number must contain only digits');
                return;
            }

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
