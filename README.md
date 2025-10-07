# Credo - Task Management System

A peer-to-peer task management platform where users can give and accept tasks, with a built-in rating system.

## Features

✅ **Working:**
- User Registration & Login
- Create Tasks
- View All Open Tasks
- Apply to Tasks
- View Applications on Your Tasks
- Accept/Reject Applications
- Mark Tasks as Complete
- Cancel Tasks
- Rate Users (Giving & Accepting ratings)
- View My Given Tasks
- View My Accepted Tasks
- View My Applications
- User Profile

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. The `.env` file should already exist with JWT_SECRET

4. Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Open `index.html` in a web browser, or use a simple HTTP server:
```bash
# Using Python 3
python3 -m http.server 8000

# OR using Node.js http-server (install with: npm install -g http-server)
http-server -p 8000
```

3. Access the application at `http://localhost:8000`

## Usage

### First Time Users

1. Open the application in your browser
2. Click "Sign Up" 
3. Fill in the registration form (username, password, phone number, roll number)
4. After registration, log in with your credentials

### Creating a Task

1. Click "Give Task" button in the navigation bar
2. Fill in task details (title, description, reward, deadline)
3. Submit the form
4. Your task will appear in "My Given Tasks"

### Accepting Tasks

1. Browse "Open Tasks"
2. Click "View & Apply" on any task
3. Review the task details
4. Click "Apply for Task"
5. Track your application in "My Applications"

### Managing Your Tasks (As Task Giver)

1. Go to "My Given Tasks"
2. Click "Manage Task" on any task
3. View all applications
4. Accept one application (others will be auto-rejected)
5. Once task is complete, mark it as "Completed"
6. Rate the task acceptor

### Completing Tasks (As Task Acceptor)

1. Go to "My Accepted Tasks"
2. Complete the task as per the agreement
3. Wait for the task giver to mark it as completed
4. Rate the task giver

## Database Schema

- **users**: User accounts with giving and accepting ratings
- **tasks**: Tasks with status (OPEN, IN_PROGRESS, COMPLETED, CANCELLED)
- **task_applications**: Applications from users to tasks
- **ratings**: Ratings given by users after task completion

## Technologies

- **Backend**: Node.js, Express.js, SQLite
- **Frontend**: HTML, CSS, Bootstrap 5, Vanilla JavaScript
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: SQLite (local file-based database)

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Tasks
- `GET /api/tasks` - Get all open tasks
- `GET /api/tasks/:id` - Get task details with applications
- `GET /api/tasks/my/given` - Get user's given tasks
- `GET /api/tasks/my/accepted` - Get user's accepted tasks
- `GET /api/tasks/my/applications` - Get user's applications
- `POST /api/tasks` - Create new task
- `POST /api/tasks/:id/apply` - Apply to a task
- `POST /api/tasks/:id/accept/:applicantId` - Accept application
- `POST /api/tasks/:id/reject/:applicantId` - Reject application
- `POST /api/tasks/:id/complete` - Mark task as completed
- `DELETE /api/tasks/:id` - Cancel task
- `POST /api/tasks/:id/rate` - Rate a user after task completion

## Troubleshooting

### Backend won't start
- Make sure port 3000 is not in use
- Check that all dependencies are installed (`npm install`)
- Verify `.env` file exists with JWT_SECRET

### Can't connect to backend from frontend
- Ensure backend is running on port 3000
- Check browser console for CORS errors
- Verify API_URL in `frontend/js/dashboard.js` is `http://localhost:3000/api`

### Login not working
- Clear browser localStorage
- Check that username and password match
- Verify backend console for errors

## Notes

- All passwords are hashed using bcrypt
- JWT tokens expire after 5 hours
- Database file (`credo.db`) is created automatically on first run
- Ratings are automatically averaged and updated in user profiles
