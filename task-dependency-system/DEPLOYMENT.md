# Deployment Guide

## Quick Start Guide

### Step 1: Backend Setup (5 minutes)

1. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Setup MySQL database:**
```bash
mysql -u root -p
```
```sql
CREATE DATABASE task_management;
CREATE USER 'taskuser'@'localhost' IDENTIFIED BY 'YourPassword123!';
GRANT ALL PRIVILEGES ON task_management.* TO 'taskuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. **Create Django project:**
```bash
django-admin startproject taskmanagement
cd taskmanagement
python manage.py startapp tasks
```

4. **Copy backend files:**
```bash
# Copy models.py, views.py, serializers.py, services.py, urls.py
# to taskmanagement/tasks/ directory
```

5. **Update settings.py** (see DJANGO_SETUP.md for full configuration)

6. **Run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

7. **Start Django server:**
```bash
python manage.py runserver
```

Backend should be running at: http://localhost:8000

### Step 2: Frontend Setup (3 minutes)

1. **Create React app:**
```bash
npx create-react-app task-management-ui
cd task-management-ui
```

2. **Install Tailwind CSS:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

3. **Copy frontend files:**
```bash
# Copy all files from frontend/ to task-management-ui/src/
# - App.jsx → src/App.js
# - api.js → src/api.js
# - components/ → src/components/
# - index.css → src/index.css
# - index.js → src/index.js
```

4. **Update tailwind.config.js** (already provided)

5. **Start React server:**
```bash
npm start
```

Frontend should be running at: http://localhost:3000

## Project Structure After Setup

```
taskmanagement/                 # Django project root
├── manage.py
├── taskmanagement/            # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── tasks/                     # Django app
    ├── models.py              ← Copy here
    ├── views.py               ← Copy here
    ├── serializers.py         ← Copy here
    ├── services.py            ← Copy here
    ├── urls.py                ← Copy here
    └── migrations/

task-management-ui/            # React project root
├── package.json
├── tailwind.config.js         ← Copy here
├── public/
└── src/
    ├── App.js                 ← Copy App.jsx here
    ├── index.js               ← Copy here
    ├── index.css              ← Copy here
    ├── api.js                 ← Copy here
    └── components/            ← Copy entire folder
        ├── TaskList.jsx
        ├── TaskItem.jsx
        ├── TaskForm.jsx
        └── DependencyGraph.jsx
```

## Verification Checklist

### Backend Verification
- [ ] Django server starts without errors
- [ ] Can access http://localhost:8000/api/tasks/
- [ ] Database tables created (check with `python manage.py showmigrations`)
- [ ] Can create a task via API
- [ ] Circular dependency detection works

Test with cURL:
```bash
# Create task
curl -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "status": "pending"}'

# List tasks
curl http://localhost:8000/api/tasks/
```

### Frontend Verification
- [ ] React app starts without errors
- [ ] Can see the UI at http://localhost:3000
- [ ] No console errors in browser
- [ ] Can create tasks through UI
- [ ] Graph visualization displays
- [ ] Dependency addition shows error messages correctly

## Common Issues & Solutions

### Issue 1: MySQL Connection Error
**Error:** `django.db.utils.OperationalError: (2003, "Can't connect to MySQL server")`

**Solution:**
- Ensure MySQL is running: `sudo service mysql start` (Linux) or check Services (Windows)
- Verify credentials in settings.py
- Check MySQL is listening on port 3306

### Issue 2: CORS Errors in Browser
**Error:** `Access to fetch at 'http://localhost:8000/api/tasks/' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:**
- Verify `django-cors-headers` is installed
- Check CORS settings in Django settings.py
- Ensure `corsheaders.middleware.CorsMiddleware` is at top of MIDDLEWARE

### Issue 3: Module Import Errors
**Error:** `ModuleNotFoundError: No module named 'rest_framework'`

**Solution:**
```bash
pip install djangorestframework django-cors-headers mysqlclient
```

### Issue 4: Tailwind Styles Not Working
**Error:** Styles not applied, page looks unstyled

**Solution:**
- Verify tailwind.config.js content paths
- Check index.css has Tailwind imports
- Restart React development server

### Issue 5: Graph Not Rendering
**Error:** Blank graph area or console errors

**Solution:**
- Check browser console for errors
- Verify Canvas is supported in browser
- Ensure graphData has correct structure

## Production Deployment Considerations

### Backend (Django)
1. **Security:**
   - Set `DEBUG = False`
   - Update `SECRET_KEY` to secure random string
   - Configure `ALLOWED_HOSTS`
   - Use environment variables for sensitive data

2. **Database:**
   - Use production-grade MySQL settings
   - Enable connection pooling
   - Set up regular backups

3. **Server:**
   - Use Gunicorn or uWSGI
   - Set up Nginx reverse proxy
   - Configure SSL/TLS certificates

```bash
# Example Gunicorn command
gunicorn taskmanagement.wsgi:application --bind 0.0.0.0:8000
```

### Frontend (React)
1. **Build for production:**
```bash
npm run build
```

2. **Serve static files:**
   - Use Nginx or Apache
   - Configure proper caching headers
   - Enable gzip compression

3. **Environment configuration:**
   - Update API_BASE_URL in api.js to production URL
   - Use environment variables

## Docker Deployment (Optional)

### Dockerfile for Backend
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "taskmanagement.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Dockerfile for Frontend
```dockerfile
FROM node:16 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: task_management
      MYSQL_USER: taskuser
      MYSQL_PASSWORD: password
      MYSQL_ROOT_PASSWORD: rootpassword
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      DATABASE_HOST: db
      DATABASE_PORT: 3306

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

Run with:
```bash
docker-compose up -d
```

## Testing After Deployment

1. **Backend API Test:**
```bash
curl http://your-domain.com/api/tasks/
```

2. **Frontend Test:**
   - Open browser to http://your-domain.com
   - Create a task
   - Add dependencies
   - Verify graph visualization

3. **Load Test (Optional):**
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test API endpoint
ab -n 1000 -c 10 http://your-domain.com/api/tasks/
```

## Monitoring & Maintenance

1. **Log Management:**
   - Django logs: Configure logging in settings.py
   - Nginx access/error logs
   - Application performance monitoring

2. **Database Maintenance:**
   - Regular backups
   - Index optimization
   - Query performance monitoring

3. **Updates:**
   - Keep dependencies up to date
   - Monitor security advisories
   - Test updates in staging first

## Support & Troubleshooting

For issues during deployment:
1. Check Django logs: `python manage.py runserver` output
2. Check browser console for frontend errors
3. Verify database connectivity
4. Check CORS configuration
5. Ensure all dependencies are installed

## Rollback Plan

If deployment fails:
1. Keep previous version backed up
2. Document configuration changes
3. Have database backup ready
4. Test rollback procedure in staging

---

**Deployment Time Estimate:** 10-15 minutes for development, 2-3 hours for production with proper testing
