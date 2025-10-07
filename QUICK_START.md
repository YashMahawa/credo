# Quick Start Guide - Credo Task Management

## 🚀 Getting Started (2 Simple Steps)

### Step 1: Start Backend Server
```bash
cd /home/yash/Videos/hackathon/credo/backend
npm start
```
✅ Server should say "Server running on port 3000"

### Step 2: Start Frontend Server
```bash
cd /home/yash/Videos/hackathon/credo/frontend
python3 -m http.server 8000
```
✅ Server should say "Serving HTTP on 0.0.0.0 port 8000"

### Step 3: Open Browser
Navigate to: **http://localhost:8000**

---

## 📋 Complete Feature List

### ✅ Authentication
- [x] User Registration
- [x] User Login
- [x] JWT Token Authentication
- [x] Auto-redirect if not logged in

### ✅ Task Management
- [x] Create new tasks
- [x] View all open tasks
- [x] View task details
- [x] Apply to tasks
- [x] View applications on your tasks
- [x] Accept applications
- [x] Reject applications
- [x] Mark tasks as completed
- [x] Cancel tasks

### ✅ User Views
- [x] Open Tasks (all available tasks)
- [x] My Given Tasks (tasks you created)
- [x] My Accepted Tasks (tasks you're working on)
- [x] My Applications (tasks you applied to)

### ✅ Rating System
- [x] Rate task givers (after completing a task)
- [x] Rate task acceptors (after your task is completed)
- [x] Automatic rating average calculation
- [x] Display giving rating (how good at giving tasks)
- [x] Display accepting rating (how good at completing tasks)

### ✅ User Profile
- [x] View profile information
- [x] See your ratings
- [x] Contact information display

---

## 🎯 User Flow Examples

### Scenario 1: I Want Someone to Do My Task

1. **Login** to your account
2. Click **"Give Task"** button
3. Fill in:
   - Task Title (e.g., "Get me lunch from canteen")
   - Description (e.g., "Please get me a sandwich and coke")
   - Reward (e.g., "₹50")
   - Deadline (select date & time)
4. Click **"Post Task"**
5. Go to **"My Given Tasks"** to track it
6. When someone applies, click **"Manage Task"**
7. View applications and click **"Accept"** on your preferred applicant
8. After they complete it, click **"Mark as Completed"**
9. **Rate** the task acceptor

### Scenario 2: I Want to Do Tasks and Earn Rewards

1. **Login** to your account
2. Browse **"Open Tasks"** 
3. Click **"View & Apply"** on any task you like
4. Read the details (reward, deadline, giver's rating)
5. Click **"Apply for Task"**
6. Track status in **"My Applications"**
7. Once accepted, it appears in **"My Accepted Tasks"**
8. Complete the task as agreed
9. Wait for giver to mark as completed
10. **Rate** the task giver

---

## 🔧 Technical Details

### Backend API (Port 3000)
- Express.js server
- SQLite database (credo.db)
- JWT authentication
- CORS enabled

### Frontend (Port 8000)
- Vanilla JavaScript
- Bootstrap 5 for styling
- Responsive design
- Real-time updates

### Database Tables
- **users** - User accounts and ratings
- **tasks** - All tasks with status
- **task_applications** - Who applied to what
- **ratings** - All ratings given

### Task Status Flow
```
OPEN → IN_PROGRESS → COMPLETED
  ↓
CANCELLED
```

### Application Status Flow
```
PENDING → ACCEPTED
   ↓
REJECTED
```

---

## 🐛 Troubleshooting

### "Failed to fetch tasks"
- Make sure backend is running on port 3000
- Check terminal for errors
- Try refreshing the page

### "Invalid credentials"
- Double-check username and password
- Make sure you registered first
- Try creating a new account

### Can't see my tasks
- Make sure you're in the right view tab
- Check that backend is running
- Open browser console (F12) for errors

### Button not working
- Make sure you're logged in
- Check browser console for errors
- Try refreshing the page

---

## 💡 Tips

1. **Ratings Matter**: Higher ratings mean more people trust you
2. **Be Specific**: Clear task descriptions get better applicants
3. **Set Realistic Deadlines**: Give enough time for task completion
4. **Communicate**: Use phone numbers for coordination
5. **Rate Fairly**: Help build a trustworthy community

---

## 🎉 Everything is Working Now!

All bugs have been fixed. You can now:
- ✅ Sign up and login
- ✅ Create tasks
- ✅ Apply to tasks  
- ✅ Accept/reject applications
- ✅ Complete tasks
- ✅ Cancel tasks
- ✅ Rate users
- ✅ View profiles
- ✅ Track everything

**Enjoy using Credo!** 🚀
