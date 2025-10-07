const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');
let tasksGrid; // Will be initialized after DOM loads
const createTaskForm = document.getElementById('create-task-form');

// Redirect to login if no token is found
if (!token) {
    window.location.href = 'index.html';
}

// Current view state
let currentView = 'open';
let currentFilter = 'OPEN'; // For all tasks view

// Time synchronization
let timeOffset = 0; // Offset between client and server time in milliseconds
let sessionStartTime = Date.now(); // When the session started

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
        sessionStartTime = clientTime;
        console.log(`Time synchronized. Offset: ${timeOffset}ms`);
    } catch (error) {
        console.error('Failed to sync time with server:', error);
        // If sync fails, use local time (offset = 0)
        timeOffset = 0;
    }
}

// Get user info from token
function getUserFromToken() {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (e) {
        return null;
    }
}

const currentUser = getUserFromToken();

// Auto-cancel expired tasks on load
async function autoCancelExpiredTasks() {
    try {
        await fetch(`${API_URL}/tasks/auto-cancel-expired`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (err) {
        console.error('Auto-cancel error:', err);
    }
}

// Function to fetch and display open tasks
const fetchOpenTasks = async () => {
    try {
        tasksGrid = document.getElementById('tasks-grid');
        const res = await fetch(`${API_URL}/tasks?status=OPEN`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const tasks = await res.json();

        tasksGrid.innerHTML = ''; // Clear existing tasks
        if (tasks.length === 0) {
            tasksGrid.innerHTML = '<div class="col-12"><p class="text-center text-muted">No open tasks available</p></div>';
            return;
        }

        tasks.forEach(task => {
            const deadline = new Date(task.deadline).toLocaleString();
            const statusBadge = getStatusBadge(task.status);
            const taskCard = `
                <div class="col-md-6 col-lg-4">
                    <div class="card task-card h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="flex-grow-1">
                                <h5 class="card-title">${escapeHtml(task.title)} ${statusBadge}</h5>
                                <p class="card-text text-muted">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</p>
                                <p class="reward mb-2">Reward: ${escapeHtml(task.reward)}</p>
                                <p class="card-text"><small class="text-muted">Deadline: ${deadline}</small></p>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <span class="giver-info">
                                    Created by: ${escapeHtml(task.giver_username)} 
                                    ${task.giver_trophies ? `<span style="font-size: 0.9rem;">🏆 ${task.giver_trophies}</span>` : ''}
                                    <span class="star">★</span> ${task.giving_rating.toFixed(1)}
                                </span>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewTask(${task.task_id})">View & Apply</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            tasksGrid.innerHTML += taskCard;
        });
    } catch (err) {
        console.error(err);
        tasksGrid.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error loading tasks</p></div>';
    }
};

// Function to fetch and display all tasks with filter
const fetchAllTasks = async (filter = null) => {
    try {
        tasksGrid = document.getElementById('tasks-grid');
        currentFilter = filter || currentFilter;
        const url = filter ? `${API_URL}/tasks?status=${filter}` : `${API_URL}/tasks`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const tasks = await res.json();

        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === (filter || 'ALL')) {
                btn.classList.add('active');
            }
        });

        tasksGrid.innerHTML = ''; // Clear existing tasks
        if (tasks.length === 0) {
            tasksGrid.innerHTML = '<div class="col-12"><p class="text-center text-muted">No tasks found</p></div>';
            return;
        }

        tasks.forEach(task => {
            const deadline = new Date(task.deadline).toLocaleString();
            const statusBadge = getStatusBadge(task.status);
            const isExpired = new Date(task.deadline) < getCurrentTime() && task.status === 'OPEN';
            const taskCard = `
                <div class="col-md-6 col-lg-4">
                    <div class="card task-card h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="flex-grow-1">
                                <h5 class="card-title">${escapeHtml(task.title)} ${statusBadge}</h5>
                                <p class="card-text text-muted">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</p>
                                <p class="reward mb-2">Reward: ${escapeHtml(task.reward)}</p>
                                <p class="card-text mb-0"><small class="text-muted">Deadline: ${deadline}</small></p>
                                ${isExpired ? '<p class="card-text mb-0"><small class="text-danger">Expired</small></p>' : '<div style="height: 1.25rem;"></div>'}
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <span class="giver-info">
                                    Created by: ${escapeHtml(task.giver_username)} 
                                    ${task.giver_trophies ? `<span style="font-size: 0.9rem;">🏆 ${task.giver_trophies}</span>` : ''}
                                    <span class="star">★</span> ${task.giving_rating.toFixed(1)}
                                </span>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewTask(${task.task_id})">View</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            tasksGrid.innerHTML += taskCard;
        });
    } catch (err) {
        console.error(err);
        tasksGrid.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error loading tasks</p></div>';
    }
};

// Function to fetch and display user's given tasks
const fetchMyGivenTasks = async () => {
    try {
        tasksGrid = document.getElementById('tasks-grid');
        const res = await fetch(`${API_URL}/tasks/my/given`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch your tasks');
        const tasks = await res.json();

        tasksGrid.innerHTML = '';
        if (tasks.length === 0) {
            tasksGrid.innerHTML = '<div class="col-12"><p class="text-center text-muted">You haven\'t created any tasks yet</p></div>';
            return;
        }

        tasks.forEach(task => {
            const deadline = new Date(task.deadline).toLocaleString();
            const statusBadge = getStatusBadge(task.status);
            const taskCard = `
                <div class="col-md-6 col-lg-4">
                    <div class="card task-card h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="flex-grow-1">
                                <h5 class="card-title">${escapeHtml(task.title)} ${statusBadge}</h5>
                                <p class="card-text text-muted">${escapeHtml(task.description.substring(0, 80))}${task.description.length > 80 ? '...' : ''}</p>
                                <p class="reward mb-2">Reward: ${escapeHtml(task.reward)}</p>
                                <p class="card-text"><small class="text-muted">Deadline: ${deadline}</small></p>
                                ${task.acceptor_username ? `<p class="card-text mb-0"><small>Acceptor: ${escapeHtml(task.acceptor_username)}</small></p>` : '<div style="height: 1.25rem;"></div>'}
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-primary w-100 mb-2" onclick="manageTask(${task.task_id})">Manage Task</button>
                                <button class="btn btn-sm btn-outline-secondary w-100" onclick="duplicateTask(${task.task_id})">Duplicate Task</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            tasksGrid.innerHTML += taskCard;
        });
    } catch (err) {
        console.error(err);
        tasksGrid.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error loading your tasks</p></div>';
    }
};

// Function to fetch and display user's accepted tasks
const fetchMyAcceptedTasks = async () => {
    try {
        tasksGrid = document.getElementById('tasks-grid');
        
        // Fetch both accepted tasks and withdrawn/removed tasks
        const [acceptedRes, withdrawnRes] = await Promise.all([
            fetch(`${API_URL}/tasks/my/accepted`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_URL}/tasks/my/withdrawn-removed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        if (!acceptedRes.ok) throw new Error('Failed to fetch accepted tasks');
        
        const acceptedTasks = await acceptedRes.json();
        const withdrawnTasks = withdrawnRes.ok ? await withdrawnRes.json() : [];
        
        // Combine and mark withdrawn/removed tasks
        const allTasks = [
            ...acceptedTasks,
            ...withdrawnTasks.map(task => ({ ...task, is_withdrawn_removed: true }))
        ];

        tasksGrid.innerHTML = '';

        if (allTasks.length === 0) {
            tasksGrid.innerHTML = '<div class="col-12"><p class="text-center text-muted">No accepted tasks yet</p></div>';
            return;
        }

        for (const task of allTasks) {
            const deadline = new Date(task.deadline).toLocaleString();
            
            // Use application_status for withdrawn/removed tasks, show "To Do" for IN_PROGRESS
            let displayStatus = task.is_withdrawn_removed ? task.application_status : task.status;
            if (displayStatus === 'IN_PROGRESS') {
                displayStatus = 'TO_DO';
            }
            const statusBadge = getStatusBadge(displayStatus);
            
            // Check if user has already rated
            let hasRated = false;
            // Allow rating for COMPLETED, CANCELLED, WITHDRAWN, and REMOVED tasks
            if (task.status === 'COMPLETED' || task.status === 'CANCELLED' || task.is_withdrawn_removed) {
                const ratingRes = await fetch(`${API_URL}/tasks/${task.task_id}/has-rated`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (ratingRes.ok) {
                    const data = await ratingRes.json();
                    hasRated = data.has_rated;
                }
            }
            
            const taskCard = `
                <div class="col-md-6 col-lg-4">
                    <div class="card task-card h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="flex-grow-1">
                                <h5 class="card-title">${escapeHtml(task.title)} ${statusBadge}</h5>
                                <p class="card-text text-muted">${escapeHtml(task.description.substring(0, 80))}${task.description.length > 80 ? '...' : ''}</p>
                                <p class="reward mb-2">Reward: ${escapeHtml(task.reward)}</p>
                                <p class="card-text"><small class="text-muted">Deadline: ${deadline}</small></p>
                                <p class="card-text"><small>Giver: ${escapeHtml(task.giver_username)} (${task.giver_phone})</small></p>
                            </div>
                            <div class="mt-3">
                                ${task.status === 'IN_PROGRESS' && !task.is_withdrawn_removed ? `<button class="btn btn-sm btn-info w-100 mb-2" onclick="manageTask(${task.task_id})">Manage Task</button>` : ''}
                                ${task.status === 'COMPLETED' && !hasRated ? `<button class="btn btn-sm btn-success w-100" onclick="rateTask(${task.task_id}, ${task.giver_id})">Rate Task Giver</button>` : ''}
                                ${task.status === 'CANCELLED' && !hasRated ? `<button class="btn btn-sm btn-warning w-100" onclick="rateTask(${task.task_id}, ${task.giver_id})">Rate Task Giver (Cancelled)</button>` : ''}
                                ${task.is_withdrawn_removed && !hasRated ? `<button class="btn btn-sm btn-warning w-100" onclick="rateTask(${task.task_id}, ${task.giver_id})">Rate Task Giver</button>` : ''}
                                ${(task.status === 'COMPLETED' || task.status === 'CANCELLED' || task.is_withdrawn_removed) && hasRated ? `<p class="text-success text-center mb-0"><i class="bi bi-check-circle-fill"></i> Already Rated</p>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            tasksGrid.innerHTML += taskCard;
        }
    } catch (err) {
        console.error(err);
        tasksGrid.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error loading accepted tasks</p></div>';
    }
};

// Function to fetch and display user's applications with filter
const fetchMyApplications = async (filter = 'ALL') => {
    try {
        tasksGrid = document.getElementById('tasks-grid');
        const res = await fetch(`${API_URL}/tasks/my/applications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch applications');
        let applications = await res.json();

        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        // Filter applications based on status
        if (filter !== 'ALL') {
            applications = applications.filter(app => {
                if (filter === 'TO_DO') {
                    // Show accepted applications where task is IN_PROGRESS
                    return app.status === 'ACCEPTED' && app.task_status === 'IN_PROGRESS';
                } else if (filter === 'COMPLETED') {
                    // Show accepted applications where task is COMPLETED
                    return app.status === 'ACCEPTED' && app.task_status === 'COMPLETED';
                } else if (filter === 'REMOVED') {
                    return app.status === 'REMOVED';
                } else if (filter === 'REJECTED') {
                    return app.status === 'REJECTED';
                } else if (filter === 'WITHDRAWN') {
                    return app.status === 'WITHDRAWN';
                }
                return false;
            });
        }

        tasksGrid.innerHTML = '';
        if (applications.length === 0) {
            tasksGrid.innerHTML = '<div class="col-12"><p class="text-center text-muted">No applications found</p></div>';
            return;
        }

        for (const app of applications) {
            const deadline = new Date(app.deadline).toLocaleString();
            
            // Determine display status: show "To Do" for accepted + in_progress
            let displayStatus = app.status;
            if (app.status === 'ACCEPTED' && app.task_status === 'IN_PROGRESS') {
                displayStatus = 'TO_DO';
            } else if (app.status === 'ACCEPTED' && app.task_status === 'COMPLETED') {
                displayStatus = 'COMPLETED';
            } else if (app.status === 'ACCEPTED' && app.task_status === 'CANCELLED') {
                displayStatus = 'CANCELLED';
            }
            
            const statusBadge = getStatusBadge(displayStatus);
            
            // Check if user can rate (for removed/withdrawn cases)
            let canRate = false;
            let hasRated = false;
            if (app.status === 'REMOVED' || app.status === 'WITHDRAWN') {
                const ratingRes = await fetch(`${API_URL}/tasks/${app.task_id}/has-rated`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (ratingRes.ok) {
                    const data = await ratingRes.json();
                    hasRated = data.has_rated;
                    canRate = !hasRated;
                }
            }
            
            const taskCard = `
                <div class="col-md-6 col-lg-4">
                    <div class="card task-card h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="flex-grow-1">
                                <h5 class="card-title">${escapeHtml(app.title)} ${statusBadge}</h5>
                                <p class="card-text text-muted">${escapeHtml(app.description.substring(0, 80))}${app.description.length > 80 ? '...' : ''}</p>
                                <p class="reward mb-2">Reward: ${escapeHtml(app.reward)}</p>
                                <p class="card-text"><small class="text-muted">Deadline: ${deadline}</small></p>
                                <p class="card-text"><small>Giver: ${escapeHtml(app.giver_username)}</small></p>
                                <p class="card-text mb-0"><small>Applied: ${new Date(app.applied_at).toLocaleDateString()}</small></p>
                            </div>
                            <div class="mt-3">
                                ${displayStatus === 'TO_DO' ? `<button class="btn btn-sm btn-info w-100" onclick="viewComments(${app.task_id})">View Task & Chat</button>` : ''}
                                ${canRate ? `<button class="btn btn-sm btn-warning w-100" onclick="rateTask(${app.task_id}, ${app.giver_id})">Rate Giver</button>` : ''}
                                ${hasRated ? `<p class="text-success text-center mb-0"><i class="bi bi-check-circle-fill"></i> Already Rated</p>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            tasksGrid.innerHTML += taskCard;
        }
    } catch (err) {
        console.error(err);
        tasksGrid.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error loading applications</p></div>';
    }
};

// View task details and apply
async function viewTask(taskId) {
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch task details');
        const data = await res.json();
        const task = data.task;
        const applications = data.applications || [];

        const deadline = new Date(task.deadline).toLocaleString();
        const statusBadge = getStatusBadge(task.status);
        
        // Check if current user is the giver
        const isOwnTask = task.giver_id === currentUser.id;
        
        // Check if user has already applied or was removed
        const hasApplied = applications.some(app => 
            app.applicant_id === currentUser.id && 
            (app.status === 'PENDING' || app.status === 'ACCEPTED')
        );
        const wasRemoved = applications.some(app => 
            app.applicant_id === currentUser.id && app.status === 'REMOVED'
        );
        
        const modalContent = `
            <h5>${escapeHtml(task.title)} ${statusBadge}</h5>
            <p class="text-muted">${escapeHtml(task.description)}</p>
            <hr>
            <p><strong>Reward:</strong> ${escapeHtml(task.reward)}</p>
            <p><strong>Deadline:</strong> ${deadline}</p>
            <p><strong>Created by:</strong> ${escapeHtml(task.giver_username)} 
               ${task.giver_trophies ? `🏆 ${task.giver_trophies}` : ''}
               <span class="star">★</span> ${task.giving_rating.toFixed(1)}</p>
            <p><strong>Contact:</strong> ${task.giver_phone}</p>
            <hr>
            <button class="btn btn-info w-100 mb-2" onclick="viewComments(${taskId}); bootstrap.Modal.getInstance(document.getElementById('taskDetailModal')).hide();">
                <i class="bi bi-chat-dots"></i> View Comments & Chat
            </button>
        `;

        document.getElementById('taskDetailContent').innerHTML = modalContent;
        
        const applyBtn = document.getElementById('applyTaskBtn');
        
        // Show/hide apply button based on conditions
        if (isOwnTask) {
            applyBtn.style.display = 'none';
        } else if (task.status !== 'OPEN') {
            applyBtn.style.display = 'none';
        } else if (hasApplied) {
            applyBtn.style.display = 'none';
        } else if (wasRemoved) {
            applyBtn.style.display = 'none';
        } else {
            applyBtn.style.display = 'block';
            applyBtn.onclick = () => applyToTask(taskId);
        }
        
        const modal = new bootstrap.Modal(document.getElementById('taskDetailModal'));
        modal.show();
    } catch (err) {
        console.error(err);
        alert('Error loading task details');
    }
}

// Apply to a task
async function applyToTask(taskId) {
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/apply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.msg || 'Failed to apply');
            return;
        }

        alert('Application submitted successfully!');
        bootstrap.Modal.getInstance(document.getElementById('taskDetailModal')).hide();
        loadView(currentView, currentFilter);
    } catch (err) {
        console.error(err);
        alert('Error submitting application');
    }
}

// Manage task (view applications, complete, cancel)
async function manageTask(taskId) {
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch task details');
        const data = await res.json();
        const task = data.task;
        const applications = data.applications;

        // Check if user has already rated
        let hasRated = false;
        if (task.status === 'COMPLETED' && task.acceptor_id) {
            const ratingRes = await fetch(`${API_URL}/tasks/${taskId}/has-rated`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (ratingRes.ok) {
                const ratingData = await ratingRes.json();
                hasRated = ratingData.has_rated;
            }
        }

        let applicationsHtml = '';
        if (applications.length === 0) {
            applicationsHtml = '<p class="text-muted">No applications yet</p>';
        } else {
            applicationsHtml = '<div class="list-group">';
            applications.forEach(app => {
                const statusBadge = getStatusBadge(app.status);
                applicationsHtml += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6>${escapeHtml(app.username)} 
                                    ${app.total_trophies ? `🏆 ${app.total_trophies}` : ''}
                                    <span class="star">★</span> ${app.accepting_rating.toFixed(1)} ${statusBadge}</h6>
                                <small>${app.phone_number}</small>
                            </div>
                            ${task.status === 'OPEN' && app.status === 'PENDING' ? `
                                <div>
                                    <button class="btn btn-sm btn-success me-2" onclick="acceptApplication(${taskId}, ${app.applicant_id})">Accept</button>
                                    <button class="btn btn-sm btn-danger" onclick="rejectApplication(${taskId}, ${app.applicant_id})">Reject</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
            applicationsHtml += '</div>';
        }

        const deadline = new Date(task.deadline).toLocaleString();
        const statusBadge = getStatusBadge(task.status);
        
        // Check if current user is the acceptor
        const isAcceptor = task.acceptor_id === currentUser.id;
        
        const modalContent = `
            <h5>${escapeHtml(task.title)} ${statusBadge}</h5>
            <p class="text-muted">${escapeHtml(task.description)}</p>
            <hr>
            <p><strong>Reward:</strong> ${escapeHtml(task.reward)}</p>
            <p><strong>Deadline:</strong> ${deadline}</p>
            ${task.acceptor_username ? `<p><strong>Acceptor:</strong> ${escapeHtml(task.acceptor_username)}</p>` : ''}
            <hr>
            <div class="mb-3">
                <button class="btn btn-info w-100" onclick="viewComments(${taskId})">
                    <i class="bi bi-chat-dots"></i> View Comments & Chat
                </button>
            </div>
            <hr>
            <h6>Applications:</h6>
            ${applicationsHtml}
            <hr>
            ${task.status === 'OPEN' || task.status === 'IN_PROGRESS' ? `
                <button class="btn btn-warning w-100 mb-2" onclick="editTask(${taskId})">
                    <i class="bi bi-pencil"></i> Edit Task (Extend Deadline)
                </button>
            ` : ''}
            ${task.status === 'IN_PROGRESS' && !isAcceptor ? `
                <button class="btn btn-success w-100 mb-2" onclick="completeTask(${taskId})">Mark as Completed</button>
            ` : ''}
            ${task.status === 'IN_PROGRESS' && !isAcceptor && task.acceptor_id ? `
                <button class="btn btn-warning w-100 mb-2" onclick="removeAcceptor(${taskId})">Remove Acceptor</button>
            ` : ''}
            ${task.status === 'IN_PROGRESS' && isAcceptor ? `
                <button class="btn btn-warning w-100 mb-2" onclick="cantDoTask(${taskId})">Can't Do It</button>
            ` : ''}
            ${task.status === 'COMPLETED' && task.acceptor_id && !hasRated ? `
                <button class="btn btn-primary w-100 mb-2" onclick="rateTask(${taskId}, ${task.acceptor_id})">Rate Task Acceptor</button>
            ` : ''}
            ${task.status === 'COMPLETED' && task.acceptor_id && hasRated ? `
                <p class="text-success text-center"><i class="bi bi-check-circle-fill"></i> Already Rated</p>
            ` : ''}
            ${task.status === 'OPEN' || task.status === 'IN_PROGRESS' ? `
                <button class="btn btn-danger w-100" onclick="cancelTask(${taskId})">Cancel Task</button>
            ` : ''}
        `;

        document.getElementById('manageTaskContent').innerHTML = modalContent;
        const modal = new bootstrap.Modal(document.getElementById('manageTaskModal'));
        modal.show();
    } catch (err) {
        console.error(err);
        alert('Error loading task details');
    }
}

// Accept application
async function acceptApplication(taskId, applicantId) {
    if (!confirm('Accept this application? This will reject all other applications.')) return;
    
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/accept/${applicantId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.msg || 'Failed to accept application');
            return;
        }

        alert('Application accepted!');
        bootstrap.Modal.getInstance(document.getElementById('manageTaskModal')).hide();
        manageTask(taskId); // Refresh the modal
    } catch (err) {
        console.error(err);
        alert('Error accepting application');
    }
}

// Reject application
async function rejectApplication(taskId, applicantId) {
    if (!confirm('Reject this application?')) return;
    
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/reject/${applicantId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.msg || 'Failed to reject application');
            return;
        }

        alert('Application rejected');
        manageTask(taskId); // Refresh
    } catch (err) {
        console.error(err);
        alert('Error rejecting application');
    }
}

// Complete task
async function completeTask(taskId) {
    if (!confirm('Mark this task as completed?')) return;
    
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.msg || 'Failed to complete task');
            return;
        }

        alert('Task marked as completed!');
        bootstrap.Modal.getInstance(document.getElementById('manageTaskModal')).hide();
        loadView(currentView, currentFilter);
    } catch (err) {
        console.error(err);
        alert('Error completing task');
    }
}

// Cancel task
async function cancelTask(taskId) {
    if (!confirm('Cancel this task?')) return;
    
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.msg || 'Failed to cancel task');
            return;
        }

        alert('Task cancelled');
        bootstrap.Modal.getInstance(document.getElementById('manageTaskModal')).hide();
        loadView(currentView, currentFilter);
    } catch (err) {
        console.error(err);
        alert('Error cancelling task');
    }
}

// Can't do it - Acceptor releases themselves from task
async function cantDoTask(taskId) {
    const reason = prompt('Are you sure you can\'t complete this task?\n\nPlease provide a reason (required):');
    
    if (reason === null) return; // User clicked cancel
    
    if (!reason || reason.trim() === '') {
        alert('Reason is required');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/cant-do`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: reason.trim() })
        });
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.msg || 'Failed to release task');
            return;
        }

        alert('Task released successfully. The giver can now rate you.');
        bootstrap.Modal.getInstance(document.getElementById('manageTaskModal')).hide();
        loadView(currentView, currentFilter);
    } catch (err) {
        console.error(err);
        alert('Error releasing task');
    }
}

// Remove acceptor - Giver removes the acceptor from task
async function removeAcceptor(taskId) {
    const reason = prompt('Are you sure you want to remove the acceptor?\n\nPlease provide a reason (required):');
    
    if (reason === null) return; // User clicked cancel
    
    if (!reason || reason.trim() === '') {
        alert('Reason is required');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/remove-acceptor`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: reason.trim() })
        });
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.msg || 'Failed to remove acceptor');
            return;
        }

        alert('Acceptor removed successfully. They can now rate you.');
        bootstrap.Modal.getInstance(document.getElementById('manageTaskModal')).hide();
        loadView(currentView, currentFilter);
    } catch (err) {
        console.error(err);
        alert('Error removing acceptor');
    }
}

// Rate task
function rateTask(taskId, ratedUserId) {
    document.getElementById('rateTaskId').value = taskId;
    document.getElementById('rateUserId').value = ratedUserId;
    document.getElementById('ratingForm').reset();
    
    const modal = new bootstrap.Modal(document.getElementById('ratingModal'));
    modal.show();
}

// Submit rating
document.getElementById('ratingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const taskId = document.getElementById('rateTaskId').value;
    const ratedUserId = document.getElementById('rateUserId').value;
    const rating = document.getElementById('ratingValue').value;
    const comment = document.getElementById('ratingComment').value;
    
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/rate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating_value: parseInt(rating),
                comment: comment,
                rated_user_id: parseInt(ratedUserId)
            })
        });
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.msg || 'Failed to submit rating');
            return;
        }

        alert('Rating submitted successfully!');
        bootstrap.Modal.getInstance(document.getElementById('ratingModal')).hide();
        if (document.getElementById('manageTaskModal').classList.contains('show')) {
            bootstrap.Modal.getInstance(document.getElementById('manageTaskModal')).hide();
        }
        loadView(currentView);
    } catch (err) {
        console.error(err);
        alert('Error submitting rating');
    }
});

// Duplicate task
async function duplicateTask(taskId) {
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch task');
        const data = await res.json();
        const task = data.task;

        // Pre-fill the form with task data
        document.getElementById('task-title').value = task.title + ' (Copy)';
        document.getElementById('task-description').value = task.description;
        document.getElementById('task-reward').value = task.reward;
        
        // Set deadline to tomorrow using synchronized time
        const tomorrow = getCurrentTime();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('task-deadline').value = tomorrow.toISOString().slice(0, 16);

        // Store task ID for duplication
        document.getElementById('create-task-form').dataset.duplicateFrom = taskId;

        const modal = new bootstrap.Modal(document.getElementById('createTaskModal'));
        modal.show();
    } catch (err) {
        console.error(err);
        alert('Error loading task for duplication');
    }
}

// Edit task (extend deadline + add comment)
async function editTask(taskId) {
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch task');
        const data = await res.json();
        const task = data.task;

        document.getElementById('editTaskId').value = taskId;
        document.getElementById('editTaskDeadline').value = new Date(task.deadline).toISOString().slice(0, 16);
        document.getElementById('editTaskComment').value = '';

        const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
        modal.show();
    } catch (err) {
        console.error(err);
        alert('Error loading task for editing');
    }
}

// Submit task edit
document.getElementById('editTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const taskId = document.getElementById('editTaskId').value;
    const deadline = document.getElementById('editTaskDeadline').value;
    const comment = document.getElementById('editTaskComment').value;
    
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deadline, comment })
        });
        const data = await res.json();
        
        if (!res.ok) {
            alert(data.msg || 'Failed to update task');
            return;
        }

        alert('Task updated successfully!');
        bootstrap.Modal.getInstance(document.getElementById('editTaskModal')).hide();
        if (bootstrap.Modal.getInstance(document.getElementById('manageTaskModal'))) {
            bootstrap.Modal.getInstance(document.getElementById('manageTaskModal')).hide();
        }
        loadView('myGiven');
    } catch (err) {
        console.error(err);
        alert('Error updating task');
    }
});

// Load and display comments for a task
// Render nested comments recursively
function renderComment(comment, level = 0) {
    const isTaskGiver = comment.user_id === comment.giver_id;
    const timestamp = new Date(comment.created_at).toLocaleString();
    const marginLeft = level * 30;
    const trophies = comment.trophies || 0;
    
    let html = `
        <div class="comment-item mb-3 p-3 border rounded" style="margin-left: ${marginLeft}px; ${level > 0 ? 'border-left: 3px solid var(--primary-color);' : ''}">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${escapeHtml(comment.username)}</strong>
                    ${trophies > 0 ? `<span class="ms-1">🏆 ${trophies}</span>` : ''}
                    ${isTaskGiver ? '<span class="badge bg-primary ms-2">Task Creator</span>' : ''}
                </div>
                <small class="text-muted">${timestamp}</small>
            </div>
            <p class="mt-2 mb-2">${escapeHtml(comment.comment_text)}</p>
            <button class="btn btn-sm btn-outline-primary" onclick="showReplyForm(${comment.comment_id})">
                <i class="bi bi-reply"></i> Reply
            </button>
            <div id="reply-form-${comment.comment_id}" style="display: none;" class="mt-2">
                <div class="input-group">
                    <input type="text" class="form-control" id="reply-text-${comment.comment_id}" placeholder="Write a reply...">
                    <button class="btn btn-primary" onclick="submitReply(${comment.comment_id})">Post</button>
                    <button class="btn btn-secondary" onclick="hideReplyForm(${comment.comment_id})">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    // Render replies recursively
    if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach(reply => {
            html += renderComment(reply, level + 1);
        });
    }
    
    return html;
}

async function loadComments(taskId) {
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch comments');
        const comments = await res.json();

        const commentsContainer = document.getElementById('commentsContainer');
        commentsContainer.innerHTML = '';

        if (comments.length === 0) {
            commentsContainer.innerHTML = '<p class="text-muted">No comments yet. Be the first to comment!</p>';
            return;
        }

        let html = '';
        comments.forEach(comment => {
            html += renderComment(comment);
        });
        commentsContainer.innerHTML = html;

        // Scroll to bottom
        commentsContainer.scrollTop = commentsContainer.scrollHeight;
    } catch (err) {
        console.error(err);
        document.getElementById('commentsContainer').innerHTML = '<p class="text-danger">Error loading comments</p>';
    }
}

// Show reply form
function showReplyForm(commentId) {
    // Hide all other reply forms
    document.querySelectorAll('[id^="reply-form-"]').forEach(form => {
        form.style.display = 'none';
    });
    // Show this reply form
    document.getElementById(`reply-form-${commentId}`).style.display = 'block';
    document.getElementById(`reply-text-${commentId}`).focus();
}

// Hide reply form
function hideReplyForm(commentId) {
    document.getElementById(`reply-form-${commentId}`).style.display = 'none';
    document.getElementById(`reply-text-${commentId}`).value = '';
}

// Submit reply
async function submitReply(parentCommentId) {
    const taskId = document.getElementById('commentsTaskId').value;
    const replyText = document.getElementById(`reply-text-${parentCommentId}`).value.trim();
    
    if (!replyText) {
        alert('Please enter a reply');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                comment_text: replyText,
                parent_comment_id: parentCommentId 
            })
        });
        
        if (!res.ok) throw new Error('Failed to add reply');

        hideReplyForm(parentCommentId);
        loadComments(taskId);
    } catch (err) {
        console.error(err);
        alert('Error adding reply');
    }
}

// Add comment to task
async function addComment(taskId) {
    const commentText = document.getElementById('newComment').value.trim();
    
    if (!commentText) {
        alert('Please enter a comment');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment_text: commentText })
        });
        
        if (!res.ok) throw new Error('Failed to add comment');

        document.getElementById('newComment').value = '';
        loadComments(taskId);
    } catch (err) {
        console.error(err);
        alert('Error adding comment');
    }
}

// Open comments modal
function viewComments(taskId) {
    document.getElementById('commentsTaskId').value = taskId;
    loadComments(taskId);
    
    const modal = new bootstrap.Modal(document.getElementById('commentsModal'));
    modal.show();
}

// Create Task Event
createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const reward = document.getElementById('task-reward').value;
    const deadline = document.getElementById('task-deadline').value;
    const duplicateFrom = e.target.dataset.duplicateFrom;

    try {
        let res;
        if (duplicateFrom) {
            // Duplicate task
            res = await fetch(`${API_URL}/tasks/${duplicateFrom}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, reward, deadline })
            });
            delete e.target.dataset.duplicateFrom;
        } else {
            // Create new task
            res = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, reward, deadline })
            });
        }
        
        if (!res.ok) throw new Error('Failed to create task');
        
        // Close modal and refresh tasks
        const modal = bootstrap.Modal.getInstance(document.getElementById('createTaskModal'));
        modal.hide();
        createTaskForm.reset();
        alert('Task created successfully!');
        loadView('myGiven');

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});

// Edit Profile Form Handler
document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phone_number = document.getElementById('editPhone').value.trim();
    const roll_number = document.getElementById('editRoll').value.trim();
    
    // Validate phone number is exactly 10 digits
    if (phone_number.length !== 10 || !/^\d{10}$/.test(phone_number)) {
        alert('Phone number must be exactly 10 digits');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ phone_number, roll_number })
        });
        
        if (!res.ok) throw new Error('Failed to update profile');
        
        const data = await res.json();
        alert('Profile updated successfully!');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        modal.hide();
        
        // Reload profile view if currently on profile
        if (currentView === 'profile') {
            loadProfileView();
        }
    } catch (err) {
        console.error(err);
        alert('Error updating profile: ' + err.message);
    }
});

// Load Profile View
async function loadProfileView() {
    try {
        const res = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load profile');
        
        const data = await res.json();
        
        const container = document.getElementById('taskContainer');
        container.innerHTML = `
            <div class="profile-section fade-in">
                <!-- Profile Header -->
                <div class="profile-header position-relative">
                    <div class="row align-items-center">
                        <div class="col-auto">
                            <div class="profile-avatar">
                                ${data.username.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div class="col">
                            <h2 class="text-white mb-1" style="font-weight: 700;">
                                ${data.username} 
                                <span class="ms-2" style="font-size: 1.2rem;">🏆 ${data.trophies || 0}</span>
                            </h2>
                            <p class="text-white mb-2" style="opacity: 0.9;">
                                <i class="bi bi-telephone-fill me-2"></i>${data.phone_number || 'N/A'}
                            </p>
                            <p class="text-white mb-0" style="opacity: 0.9;">
                                <i class="bi bi-card-text me-2"></i>Roll: ${data.roll_number || 'N/A'}
                            </p>
                        </div>
                        <div class="col-auto">
                            <button class="btn btn-light" onclick="openEditProfileModal()">
                                <i class="bi bi-pencil-square me-2"></i>Edit Profile
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Trophies -->
                <div class="row mb-4">
                    <div class="col-12 mb-3">
                        <div class="stats-card" style="background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #000;">
                            <h5 class="mb-3" style="font-weight: 700;">🏆 Trophies</h5>
                            <div class="stats-number" style="color: #000 !important; -webkit-text-fill-color: #000 !important; font-size: 3.5rem; background: none;">${data.trophies || 0}</div>
                            <div class="stats-label" style="color: #333;">Tasks Completed Successfully</div>
                        </div>
                    </div>
                </div>

                <!-- Ratings -->
                <div class="row mb-4">
                    <div class="col-md-6 mb-3">
                        <div class="stats-card">
                            <h5 class="mb-3" style="color: var(--text-color);">Rating as Task Creator</h5>
                            <div class="d-flex align-items-center justify-content-center">
                                <div class="stats-number me-3" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${data.giving_rating.toFixed(1)}</div>
                                <div class="text-start">
                                    <div class="mb-1">
                                        ${generateStars(data.giving_rating)}
                                    </div>
                                    <small class="text-muted">${data.giving_rating_count || 0} ratings</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="stats-card">
                            <h5 class="mb-3" style="color: var(--text-color);">Rating as Task Doer</h5>
                            <div class="d-flex align-items-center justify-content-center">
                                <div class="stats-number me-3" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${data.accepting_rating.toFixed(1)}</div>
                                <div class="text-start">
                                    <div class="mb-1">
                                        ${generateStars(data.accepting_rating)}
                                    </div>
                                    <small class="text-muted">${data.accepting_rating_count || 0} ratings</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats Overview -->
                <h4 class="mb-4" style="color: var(--text-color); font-weight: 700;">Task Statistics</h4>
                <div class="row mb-4">
                    <div class="col-md-3 col-sm-6 mb-3">
                        <div class="stats-card">
                            <div class="stats-number" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${data.stats.tasks_given}</div>
                            <div class="stats-label">Tasks Given</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                        <div class="stats-card">
                            <div class="stats-number" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${data.stats.tasks_accepted}</div>
                            <div class="stats-label">Tasks Accepted</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                        <div class="stats-card">
                            <div class="stats-number" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${data.stats.tasks_completed}</div>
                            <div class="stats-label">Tasks Completed</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                        <div class="stats-card">
                            <div class="stats-number" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${data.stats.applications}</div>
                            <div class="stats-label">Applications</div>
                        </div>
                    </div>
                </div>

                <!-- Ratings Received Section -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="stats-card" style="padding: 2rem;">
                            <h5 class="mb-4" style="color: var(--text-color); font-weight: 700;">Ratings Received</h5>
                            <ul class="nav nav-tabs mb-3" id="ratingsTab" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="giving-tab" data-bs-toggle="tab" data-bs-target="#giving" type="button" role="tab">
                                        Giving Tasks
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="accepting-tab" data-bs-toggle="tab" data-bs-target="#accepting" type="button" role="tab">
                                        Accepting Tasks
                                    </button>
                                </li>
                            </ul>
                            <div class="tab-content" id="ratingsTabContent">
                                <div class="tab-pane fade show active" id="giving" role="tabpanel">
                                    <div id="givingRatings">Loading...</div>
                                </div>
                                <div class="tab-pane fade" id="accepting" role="tabpanel">
                                    <div id="acceptingRatings">Loading...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bar Chart -->
                <div class="row">
                    <div class="col-12">
                        <div class="stats-card" style="padding: 2rem;">
                            <h5 class="mb-4" style="color: var(--text-color); font-weight: 700;">Activity Overview</h5>
                            <canvas id="activityChart" style="max-height: 300px;"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load ratings received
        loadUserRatings();

        // Create Chart
        const ctx = document.getElementById('activityChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Tasks Given', 'Tasks Accepted', 'Tasks Completed'],
                datasets: [{
                    label: 'Count',
                    data: [data.stats.tasks_given, data.stats.tasks_accepted, data.stats.tasks_completed],
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(240, 147, 251, 0.8)',
                        'rgba(16, 185, 129, 0.8)'
                    ],
                    borderColor: [
                        'rgba(102, 126, 234, 1)',
                        'rgba(240, 147, 251, 1)',
                        'rgba(16, 185, 129, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                weight: 600
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
    } catch (err) {
        console.error('Profile load error:', err);
        const container = document.getElementById('taskContainer');
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Failed to load profile. Error: ${err.message}
                    <br><small>Check console for details.</small>
                </div>
            </div>
        `;
    }
}

async function openEditProfileModal() {
    try {
        // Fetch current profile data
        const res = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const profile = await res.json();
        
        // Pre-fill the form
        document.getElementById('editPhone').value = profile.phone_number;
        document.getElementById('editRoll').value = profile.roll_number;
        
        const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        modal.show();
    } catch (err) {
        console.error(err);
        alert('Error loading profile data');
    }
}

function generateStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="bi bi-star-fill star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="bi bi-star-half star"></i>';
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="bi bi-star star"></i>';
    }
    return stars;
}

// Helper function to get medal for leaderboard rank
function getMedalForRank(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
}

// Helper function to display rating with stars and optional medal
function displayRatingWithMedal(rating, rank = null) {
    const stars = generateStars(rating);
    const medal = rank ? getMedalForRank(rank) : '';
    return medal ? `${stars} ${medal}` : stars;
}

// Load user ratings
async function loadUserRatings() {
    try {
        const res = await fetch(`${API_URL}/auth/ratings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load ratings');
        
        const ratings = await res.json();
        
        // Separate giving and accepting ratings
        const givingRatings = ratings.filter(r => r.rating_type === 'GIVING');
        const acceptingRatings = ratings.filter(r => r.rating_type === 'ACCEPTING');
        
        // Display giving ratings
        const givingContainer = document.getElementById('givingRatings');
        if (givingRatings.length === 0) {
            givingContainer.innerHTML = '<p class="text-muted text-center">No ratings received yet for giving tasks</p>';
        } else {
            givingContainer.innerHTML = givingRatings.map(rating => `
                <div class="mb-3 p-3 border rounded" style="background: rgba(255,255,255,0.02);">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <strong>${escapeHtml(rating.rater_username)}</strong>
                            <div class="mt-1">${generateStars(rating.rating_value)}</div>
                        </div>
                        <small class="text-muted">${new Date(rating.created_at).toLocaleDateString()}</small>
                    </div>
                    <p class="mb-1"><small class="text-muted">Task: ${escapeHtml(rating.task_title)}</small></p>
                    ${rating.comment ? `<p class="mb-0 mt-2">${escapeHtml(rating.comment)}</p>` : ''}
                </div>
            `).join('');
        }
        
        // Display accepting ratings
        const acceptingContainer = document.getElementById('acceptingRatings');
        if (acceptingRatings.length === 0) {
            acceptingContainer.innerHTML = '<p class="text-muted text-center">No ratings received yet for accepting tasks</p>';
        } else {
            acceptingContainer.innerHTML = acceptingRatings.map(rating => `
                <div class="mb-3 p-3 border rounded" style="background: rgba(255,255,255,0.02);">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <strong>${escapeHtml(rating.rater_username)}</strong>
                            <div class="mt-1">${generateStars(rating.rating_value)}</div>
                        </div>
                        <small class="text-muted">${new Date(rating.created_at).toLocaleDateString()}</small>
                    </div>
                    <p class="mb-1"><small class="text-muted">Task: ${escapeHtml(rating.task_title)}</small></p>
                    ${rating.comment ? `<p class="mb-0 mt-2">${escapeHtml(rating.comment)}</p>` : ''}
                </div>
            `).join('');
        }
        
    } catch (err) {
        console.error('Error loading ratings:', err);
        document.getElementById('givingRatings').innerHTML = '<p class="text-danger">Error loading ratings</p>';
        document.getElementById('acceptingRatings').innerHTML = '<p class="text-danger">Error loading ratings</p>';
    }
}

// Leaderboard View
async function loadLeaderboardView() {
    const container = document.getElementById('taskContainer');
    container.innerHTML = `
        <div class="leaderboard-section fade-in">
            <h3 class="mb-4">🏆 Leaderboard - Top Performers</h3>
            <div id="leaderboard-content"></div>
        </div>
    `;
    
    // Load leaderboard
    loadLeaderboard();
}

async function loadLeaderboard() {
    try {
        const res = await fetch(`${API_URL}/auth/leaderboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load leaderboard');
        
        const users = await res.json();
        const container = document.getElementById('leaderboard-content');
        
        if (users.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No data available yet</p>';
            return;
        }
        
        let html = '<div class="leaderboard-list">';
        
        users.forEach((user, index) => {
            const position = index + 1;
            let positionBadge = '';
            let cardClass = '';
            let medal = getMedalForRank(position);
            
            if (position === 1) {
                positionBadge = '🥇';
                cardClass = 'border-warning';
            } else if (position === 2) {
                positionBadge = '🥈';
                cardClass = 'border-secondary';
            } else if (position === 3) {
                positionBadge = '🥉';
                cardClass = 'border-danger';
            } else {
                positionBadge = `#${position}`;
            }
            
            const trophyDisplay = `🏆 ${user.trophies || 0}`;
            const avgRating = ((user.giving_rating + user.accepting_rating) / 2).toFixed(1);
            const starsWithMedal = medal ? `${generateStars(avgRating)} ${medal}` : generateStars(avgRating);
            
            html += `
                <div class="stats-card mb-3 ${cardClass}" style="border-width: 2px;">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center">
                            <div class="me-3" style="font-size: 2rem; font-weight: 700; min-width: 60px;">
                                ${positionBadge}
                            </div>
                            <div>
                                <h5 class="mb-1" style="color: var(--text-color); font-weight: 700;">
                                    ${escapeHtml(user.username)}
                                </h5>
                                <div>
                                    <span class="me-3" style="font-size: 1.1rem;">${trophyDisplay}</span>
                                    <span style="font-size: 1.1rem;">${starsWithMedal}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
    } catch (err) {
        console.error('Error loading leaderboard:', err);
        const container = document.getElementById('leaderboard-content');
        if (container) {
            container.innerHTML = '<p class="text-danger">Error loading leaderboard</p>';
        }
    }
}

// View switching
function loadView(view, filter = null) {
    currentView = view;
    
    // Update active nav item
    document.querySelectorAll('.view-nav').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`[data-view="${view}"]`);
    if (navItem) navItem.classList.add('active');
    
    // Show/hide filter buttons
    const filterContainerAllTasks = document.getElementById('filterContainerAllTasks');
    const filterContainerApplications = document.getElementById('filterContainerApplications');
    
    if (view === 'allTasks') {
        filterContainerAllTasks.style.display = 'block';
        filterContainerApplications.style.display = 'none';
    } else if (view === 'myApplications') {
        filterContainerAllTasks.style.display = 'none';
        filterContainerApplications.style.display = 'block';
    } else {
        filterContainerAllTasks.style.display = 'none';
        filterContainerApplications.style.display = 'none';
    }
    
    // Update heading
    const headings = {
        'open': 'Open Tasks',
        'allTasks': 'All Tasks',
        'myGiven': 'My Given Tasks',
        'myApplications': 'My Applications',
        'profile': 'My Profile',
        'leaderboard': '🏆 Leaderboard'
    };
    document.getElementById('viewHeading').textContent = headings[view];
    
    // Get containers
    const taskContainer = document.getElementById('taskContainer');
    
    // Clear and reset containers based on view type
    if (view === 'profile' || view === 'leaderboard') {
        // For profile and leaderboard, replace entire taskContainer content
        taskContainer.innerHTML = '';
    } else {
        // For task views, ensure we have a clean tasks-grid
        taskContainer.innerHTML = '<div id="tasks-grid" class="row g-4"></div>';
    }
    
    // Load appropriate data
    switch(view) {
        case 'open':
            fetchOpenTasks();
            break;
        case 'allTasks':
            fetchAllTasks(filter);
            break;
        case 'myGiven':
            fetchMyGivenTasks();
            break;
        case 'myApplications':
            fetchMyApplications(filter || 'ALL');
            break;
        case 'profile':
            loadProfileView();
            break;
        case 'leaderboard':
            loadLeaderboardView();
            break;
    }
}

// Logout functionality
document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

// Load profile
async function loadProfile() {
    try {
        const res = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const profile = await res.json();
        
        const profileHtml = `
            <p><strong>Username:</strong> ${escapeHtml(profile.username)}</p>
            <p><strong>Phone:</strong> ${profile.phone_number}</p>
            <p><strong>Roll Number:</strong> ${profile.roll_number}</p>
            <p><strong>Giving Rating:</strong> <span class="star">★</span> ${profile.giving_rating.toFixed(1)}</p>
            <p><strong>Accepting Rating:</strong> <span class="star">★</span> ${profile.accepting_rating.toFixed(1)}</p>
            <p><strong>Member Since:</strong> ${new Date(profile.created_at).toLocaleDateString()}</p>
        `;
        
        document.getElementById('profileContent').innerHTML = profileHtml;
        const modal = new bootstrap.Modal(document.getElementById('profileModal'));
        modal.show();
    } catch (err) {
        console.error(err);
        alert('Error loading profile');
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusBadge(status) {
    const badges = {
        'OPEN': '<span class="badge bg-success">Open</span>',
        'IN_PROGRESS': '<span class="badge bg-warning">In Progress</span>',
        'TO_DO': '<span class="badge bg-info">To Do</span>',
        'COMPLETED': '<span class="badge bg-primary">Completed</span>',
        'CANCELLED': '<span class="badge bg-secondary">Cancelled</span>',
        'PENDING': '<span class="badge bg-info">Pending</span>',
        'ACCEPTED': '<span class="badge bg-success">Accepted</span>',
        'REJECTED': '<span class="badge bg-danger">Rejected</span>',
        'WITHDRAWN': '<span class="badge bg-warning">Withdrawn</span>',
        'REMOVED': '<span class="badge bg-danger">Removed</span>'
    };
    return badges[status] || '';
}

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
    // Sync time with server first
    await syncTimeWithServer();
    
    autoCancelExpiredTasks();
    loadView('allTasks', 'OPEN'); // Load "All Tasks" view with "OPEN" filter by default
    
    // Add phone number validation for edit profile modal
    const editPhoneInput = document.getElementById('editPhone');
    if (editPhoneInput) {
        editPhoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
            if (e.target.value.length > 10) {
                e.target.value = e.target.value.slice(0, 10);
            }
        });
        
        editPhoneInput.addEventListener('keypress', (e) => {
            if (!/\d/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                e.preventDefault();
            }
            if (e.target.value.length >= 10 && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                e.preventDefault();
            }
        });
    }
});
