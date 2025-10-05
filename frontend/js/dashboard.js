const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');
const tasksGrid = document.getElementById('tasks-grid');
const createTaskForm = document.getElementById('create-task-form');

// Redirect to login if no token is found
if (!token) {
    window.location.href = 'index.html';
}

// Function to fetch and display tasks
const fetchTasks = async () => {
    try {
        const res = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const tasks = await res.json();

        tasksGrid.innerHTML = ''; // Clear existing tasks
        tasks.forEach(task => {
            const deadline = new Date(task.deadline).toLocaleString();
            const taskCard = `
                <div class="col-md-6 col-lg-4">
                    <div class="card task-card h-100">
                        <div class="card-body">
                            <div>
                                <h5 class="card-title">${task.title}</h5>
                                <p class="card-text text-muted">${task.description.substring(0, 100)}...</p>
                            </div>
                            <div class="mt-4">
                                <p class="reward mb-2">Reward: ${task.reward}</p>
                                <p class="card-text"><small class="text-muted">Deadline: ${deadline}</small></p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="giver-info">Giver: ${task.giver_username} <span class="star">★</span> ${task.giving_rating.toFixed(1)}</span>
                                    <a href="#" class="btn btn-sm btn-outline-primary">View & Apply</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            tasksGrid.innerHTML += taskCard;
        });
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};

// Create Task Event
createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const reward = document.getElementById('task-reward').value;
    const deadline = document.getElementById('task-deadline').value;

    try {
        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, reward, deadline })
        });
        if (!res.ok) throw new Error('Failed to create task');
        
        // Close modal and refresh tasks
        const modal = bootstrap.Modal.getInstance(document.getElementById('createTaskModal'));
        modal.hide();
        createTaskForm.reset();
        fetchTasks();

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});


// Logout functionality
document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});


// Initial fetch of tasks when the page loads
document.addEventListener('DOMContentLoaded', fetchTasks);
