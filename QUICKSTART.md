# Quick Start Guide - Task Dependency Management System

## 🚀 Get Started in 10 Minutes

### Prerequisites Check
- [ ] Python 3.8+ installed (`python --version`)
- [ ] Node.js 14+ installed (`node --version`)
- [ ] MySQL 8.0+ installed and running
- [ ] pip installed (`pip --version`)
- [ ] npm installed (`npm --version`)

## Step 1: Backend Setup (5 minutes)

### 1.1 Create Database
```bash
mysql -u root -p
```
```sql
CREATE DATABASE task_management;
CREATE USER 'taskuser'@'localhost' IDENTIFIED BY 'Pass1234!';
GRANT ALL PRIVILEGES ON task_management.* TO 'taskuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 1.2 Setup Django Project
```bash
# Install dependencies
pip install django djangorestframework mysqlclient django-cors-headers

# Create project
django-admin startproject taskmanagement
cd taskmanagement

# Create app
python manage.py startapp tasks
```

### 1.3 Copy Backend Files
Copy these files from `backend/` folder to `taskmanagement/tasks/`:
- models.py
- views.py
- serializers.py
- services.py
- urls.py

### 1.4 Configure Django
Edit `taskmanagement/settings.py`:

1. Add to INSTALLED_APPS:
```python
INSTALLED_APPS = [
    # ... existing apps ...
    'rest_framework',
    'corsheaders',
    'tasks',
]
```

2. Add to MIDDLEWARE (at the top):
```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... rest of middleware ...
]
```

3. Update DATABASES:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'task_management',
        'USER': 'taskuser',
        'PASSWORD': 'Pass1234!',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

4. Add CORS settings:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

5. Edit `taskmanagement/urls.py`:
```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('tasks.urls')),
]
```

### 1.5 Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 1.6 Start Backend Server
```bash
python manage.py runserver
```

✅ Backend running at: http://localhost:8000

Test it: http://localhost:8000/api/tasks/

## Step 2: Frontend Setup (3 minutes)

### 2.1 Create React App
```bash
# In a new terminal window
npx create-react-app task-management-ui
cd task-management-ui
```

### 2.2 Install Tailwind CSS
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2.3 Copy Frontend Files
Copy from `frontend/` folder to `task-management-ui/src/`:
- App.jsx → src/App.js
- api.js → src/api.js
- index.js → src/index.js
- index.css → src/index.css
- components/ → src/components/ (entire folder)

Copy to root:
- tailwind.config.js → task-management-ui/tailwind.config.js

### 2.4 Start Frontend Server
```bash
npm start
```

✅ Frontend running at: http://localhost:3000

## Step 3: Verify Installation (2 minutes)

### Backend Test
```bash
curl http://localhost:8000/api/tasks/
```
Expected: `[]` (empty array)

### Create Test Task
```bash
curl -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "description": "Testing", "status": "pending"}'
```

### Frontend Test
1. Open http://localhost:3000 in browser
2. Click "Add Task"
3. Fill in form and submit
4. Verify task appears in list

## Common Issues & Quick Fixes

### Issue: "ModuleNotFoundError: No module named 'rest_framework'"
```bash
pip install djangorestframework django-cors-headers mysqlclient
```

### Issue: "Access to fetch has been blocked by CORS policy"
Add to Django settings.py:
```python
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
```

### Issue: "Can't connect to MySQL server"
```bash
# Linux/Mac
sudo service mysql start

# Windows
# Start MySQL service from Services panel
```

### Issue: "Tailwind styles not working"
1. Check `tailwind.config.js` has correct content paths
2. Verify `index.css` has Tailwind imports
3. Restart React dev server

## Quick Feature Test

### Test 1: Create Tasks
1. Create 3 tasks: A, B, C
2. Verify they appear in the list

### Test 2: Add Dependencies
1. Expand Task B
2. Click "Add Dependency"
3. Select Task A
4. Verify dependency added

### Test 3: Circular Dependency Prevention
1. Expand Task A
2. Try to add Task B as dependency
3. Should see error: "Circular dependency detected"

### Test 4: Status Updates
1. Change Task A status to "Completed"
2. Task B should automatically become "In Progress"

### Test 5: Graph Visualization
1. Check right panel shows graph
2. Click nodes to select
3. Drag to pan, scroll to zoom

## File Structure Overview

```
Your workspace should look like:

workspace/
├── taskmanagement/              # Django backend
│   ├── manage.py
│   ├── taskmanagement/
│   │   ├── settings.py         ← Edit this
│   │   └── urls.py             ← Edit this
│   └── tasks/                  ← Copy backend files here
│       ├── models.py
│       ├── views.py
│       ├── serializers.py
│       ├── services.py
│       └── urls.py
│
└── task-management-ui/         # React frontend
    ├── package.json
    ├── tailwind.config.js
    └── src/                    ← Copy frontend files here
        ├── App.js
        ├── api.js
        ├── index.js
        ├── index.css
        └── components/
            ├── TaskList.jsx
            ├── TaskItem.jsx
            ├── TaskForm.jsx
            └── DependencyGraph.jsx
```

## Next Steps

1. ✅ Read README.md for complete documentation
2. ✅ Read TESTING_GUIDE.md for test cases
3. ✅ Read DEPLOYMENT.md for production setup
4. ✅ Check PROJECT_SUMMARY.md for technical details

## Support

If you encounter issues:
1. Check the detailed documentation in README.md
2. Review DJANGO_SETUP.md for backend configuration
3. Verify all dependencies are installed
4. Check browser console for frontend errors
5. Check Django server output for backend errors

## Success Checklist

- [ ] Backend server running without errors
- [ ] Can access http://localhost:8000/api/tasks/
- [ ] Frontend loads at http://localhost:3000
- [ ] Can create tasks through UI
- [ ] Can add dependencies
- [ ] Circular dependency detection works
- [ ] Graph visualization displays
- [ ] Status updates work correctly

---

**Total Setup Time:** ~10 minutes
**Ready to Go!** 🎉
