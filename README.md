# 🏆 Credo - Collaborative Task Management Platform

**Credo** is a modern, feature-rich task management platform that connects task creators with task doers. Built with a clean architecture using Node.js, Express.js, and SQLite, Credo enables users to create tasks, apply for tasks, track applications, rate each other, and compete on a gamified leaderboard.

---

## ✨ Features

### 🎯 Core Functionality
- **Task Management**: Create, view, and manage tasks with deadlines, rewards, and descriptions
- **Smart Applications**: Apply to tasks, track application status (Pending, Accepted, Rejected, Removed)
- **Real-Time Status Updates**: Dynamic status badges for tasks and applications
- **Advanced Filters**: Filter tasks by status (Open, In Progress, Completed) and applications by type

### 👥 User System
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Comprehensive Profiles**: View user stats including trophies, ratings, and task history
- **Duplicate Prevention**: Phone number and roll number uniqueness validation

### ⭐ Rating System
- **Dual Rating Types**: 
  - **Task Creator Rating**: Rate users who create tasks (1-5 stars)
  - **Task Doer Rating**: Rate users who complete tasks (1-5 stars)
- **One-Time Ratings**: Users can only rate each other once per task
- **Average Calculations**: Automatic weighted rating calculations

### 🏅 Gamification
- **Trophy System**: Earn trophies for successfully completing tasks
- **Leaderboard**: Compete with others based on trophies and overall ratings
- **Medal Rankings**: Top 3 performers get special medals (🥇🥈🥉)
- **Visual Achievements**: Trophy counts displayed throughout the interface

### 💬 Communication
- **Task Comments**: Threaded comment system for task discussions
- **Nested Replies**: Reply to comments with unlimited nesting depth
- **User Context**: See commenter's trophy count and task creator badge

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-friendly Bootstrap 5 interface
- **Gradient Themes**: Beautiful color gradients and modern card layouts
- **Status Badges**: Color-coded badges for quick status recognition
- **Smooth Animations**: Fade-in effects and smooth transitions

### ⚡ Advanced Features
- **Task Withdrawal**: Applicants can withdraw ("Can't do it") with rating preservation
- **Acceptor Removal**: Task creators can remove acceptors with mandatory rating
- **Time Synchronization**: Client-server time sync for accurate deadlines
- **Expired Task Detection**: Automatic detection and display of expired tasks
- **Dynamic Content**: Real-time updates without page refreshes

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Security**: CORS enabled, token-based auth

### Frontend
- **Framework**: Vanilla JavaScript (ES6+)
- **UI Library**: Bootstrap 5
- **Icons**: Bootstrap Icons
- **Styling**: Custom CSS with CSS variables

### Database Schema
- **users**: User accounts with ratings and trophies
- **tasks**: Task details with status tracking
- **task_applications**: Application management with status
- **ratings**: User rating system (giving/accepting types)
- **task_comments**: Threaded comment system

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)
- Python 3 (for serving frontend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YashMahawa/credo.git
   cd credo
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the backend server**
   ```bash
   npm start
   # Server runs on http://localhost:3000
   ```

4. **Start the frontend server** (in a new terminal)
   ```bash
   cd frontend
   python3 -m http.server 8000
   # Frontend runs on http://localhost:8000
   ```

5. **Access the application**
   - Open your browser and navigate to: `http://localhost:8000`
   - Register a new account or login with existing credentials

---

## 📁 Project Structure

```
credo/
├── backend/
│   ├── server.js           # Express server setup
│   ├── database.js         # Database initialization & migrations
│   ├── db.js              # Database connection wrapper
│   ├── middleware.js      # JWT authentication middleware
│   ├── credo.db           # SQLite database file
│   ├── package.json       # Backend dependencies
│   └── routes/
│       ├── auth.js        # Authentication & user routes
│       └── tasks.js       # Task & application routes
├── frontend/
│   ├── index.html         # Login/Register page
│   ├── dashboard.html     # Main application dashboard
│   ├── css/
│   │   └── style.css      # Custom styles
│   └── js/
│       ├── auth.js        # Login/Register logic
│       └── dashboard.js   # Dashboard functionality
└── README.md              # This file
```

---

## 🎮 How to Use

### 1. **Registration & Login**
- Create an account with username, password, phone number, and roll number
- Login with your credentials to access the dashboard

### 2. **Creating Tasks**
- Click "Create Task" button
- Fill in title, description, reward, and deadline
- Task appears in "My Given Tasks" view

### 3. **Applying to Tasks**
- Browse "All Tasks" or "Open Tasks"
- Click "View & Apply" on any task
- Submit your application

### 4. **Managing Applications**
- **As Task Creator**: Accept or reject applications in task details
- **As Applicant**: Track status in "My Applications" view
- Use filters: All, To Do, Completed, Removed, Rejected

### 5. **Task Completion**
- Task creator marks task as complete
- Both parties rate each other (1-5 stars)
- Trophy awarded to task doer automatically

### 6. **Withdrawal & Removal**
- **Withdraw**: Click "Can't do it" to withdraw from accepted task
- **Remove Acceptor**: Task creator can remove current acceptor
- Both actions require rating the other party

### 7. **View Leaderboard**
- Check rankings based on trophies and ratings
- Top 3 users get special medal badges
- See stars with medals for top performers

### 8. **Comments & Discussion**
- Click "View Comments & Chat" on any task
- Post comments and reply to others
- Nested conversation threads

---

## 📊 Database Schema

### Users Table
```sql
- user_id (PRIMARY KEY)
- username (UNIQUE)
- password_hash
- phone_number (UNIQUE)
- roll_number (UNIQUE)
- giving_rating (default 5.0)
- accepting_rating (default 5.0)
- giving_rating_count (default 0)
- accepting_rating_count (default 0)
- trophies (default 0)
- created_at (TIMESTAMP)
```

### Tasks Table
```sql
- task_id (PRIMARY KEY)
- giver_id (FOREIGN KEY -> users)
- acceptor_id (FOREIGN KEY -> users)
- title
- description
- reward
- deadline (DATETIME)
- status (OPEN, IN_PROGRESS, COMPLETED)
- created_at (TIMESTAMP)
```

### Task Applications Table
```sql
- application_id (PRIMARY KEY)
- task_id (FOREIGN KEY -> tasks)
- applicant_id (FOREIGN KEY -> users)
- status (PENDING, ACCEPTED, REJECTED, REMOVED)
- applied_at (TIMESTAMP)
```

### Ratings Table
```sql
- rating_id (PRIMARY KEY)
- rater_id (FOREIGN KEY -> users)
- rated_id (FOREIGN KEY -> users)
- task_id (FOREIGN KEY -> tasks)
- rating_value (1-5)
- rating_type (GIVING, ACCEPTING)
- created_at (TIMESTAMP)
```

### Task Comments Table
```sql
- comment_id (PRIMARY KEY)
- task_id (FOREIGN KEY -> tasks)
- user_id (FOREIGN KEY -> users)
- comment_text
- parent_comment_id (FOREIGN KEY -> task_comments)
- created_at (TIMESTAMP)
```

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (authenticated)
- `PUT /api/auth/profile` - Update profile (authenticated)
- `GET /api/auth/leaderboard` - Get leaderboard rankings
- `GET /api/auth/ratings` - Get user's received ratings

### Tasks
- `GET /api/tasks` - Get all tasks (with optional status filter)
- `GET /api/tasks/open` - Get open tasks
- `GET /api/tasks/my/given` - Get user's created tasks
- `GET /api/tasks/:id` - Get single task with applications
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/apply` - Apply to task
- `PUT /api/tasks/:id/accept/:applicantId` - Accept application
- `PUT /api/tasks/:id/reject/:applicantId` - Reject application
- `PUT /api/tasks/:id/complete` - Mark task complete (with rating)
- `PUT /api/tasks/:id/withdraw` - Withdraw from task (with rating)
- `PUT /api/tasks/:id/remove-acceptor` - Remove acceptor (with rating)
- `GET /api/tasks/my/applications` - Get user's applications

### Comments
- `GET /api/tasks/:id/comments` - Get task comments
- `POST /api/tasks/:id/comments` - Post comment or reply

### Utility
- `GET /api/time` - Get server time for synchronization

---

## 🎯 Key Features Explained

### Trophy System
- Trophies are awarded when a task is successfully completed
- Only the task doer (acceptor) receives a trophy
- Trophy count is visible on profiles, leaderboards, and throughout the app
- Used as primary ranking metric on leaderboard

### Rating System
- **Task Creator Rating**: How well you create and manage tasks
- **Task Doer Rating**: How well you complete tasks
- Ratings are mandatory when completing, withdrawing, or removing
- One rating per user per task to prevent spam
- Average ratings displayed with star visualization

### Application Status Flow
```
PENDING → ACCEPTED → (Task Complete) → COMPLETED
       → REJECTED
       → REMOVED (by task creator)
       
ACCEPTED → (Withdrawal) → REMOVED
```

### Leaderboard Algorithm
```
Ranking = ORDER BY trophies DESC, overall_rating DESC
Overall Rating = (Task Creator Rating + Task Doer Rating) / 2
```

---

## 🔧 Configuration

### Environment Variables (Optional)
Create a `.env` file in the backend directory:
```env
PORT=3000
JWT_SECRET=your_secret_key_here
DB_PATH=./credo.db
```

### Frontend Configuration
Update API URL in `frontend/js/dashboard.js` and `frontend/js/auth.js`:
```javascript
const API_URL = 'http://localhost:3000/api';
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill existing process
pkill -f "node server.js"
pkill -f "python3 -m http.server 8000"
```

### Database Reset
```bash
cd backend
rm credo.db
npm start  # Will recreate database with migrations
```

### CORS Issues
Ensure backend `server.js` has CORS enabled:
```javascript
app.use(cors());
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Yash Mahawa**
- GitHub: [@YashMahawa](https://github.com/YashMahawa)
- Repository: [credo](https://github.com/YashMahawa/credo)

---

## 🙏 Acknowledgments

- Bootstrap team for the amazing UI framework
- Express.js community for excellent documentation
- SQLite for the lightweight, serverless database

---

## 📸 Screenshots

*(Add screenshots of your application here)*

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Task Details
![Task Details](screenshots/task-details.png)

### Leaderboard
![Leaderboard](screenshots/leaderboard.png)

---

## 🔮 Future Enhancements

- [ ] Email notifications for task updates
- [ ] File attachments for tasks
- [ ] Advanced search and filtering
- [ ] Task categories and tags
- [ ] User messaging system
- [ ] Task templates
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (WebSockets)
- [ ] Task dispute resolution system
- [ ] Admin dashboard

---

**Made with ❤️ for collaborative task management**

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
