# Testing Circular Dependency Detection

## Test Cases for Manual Testing

### Test Case 1: Simple Circular Dependency (2 tasks)
**Setup:**
1. Create Task 1: "Design Database"
2. Create Task 2: "Implement Backend"
3. Add dependency: Task 2 depends on Task 1 ✓ (Should succeed)
4. Add dependency: Task 1 depends on Task 2 ✗ (Should fail)

**Expected Result:**
- Error: "Circular dependency detected"
- Path: [1, 2, 1]

### Test Case 2: Longer Circular Dependency (3 tasks)
**Setup:**
1. Create Task 1: "Plan Project"
2. Create Task 2: "Design UI"
3. Create Task 3: "Implement Features"
4. Add dependency: Task 2 depends on Task 1 ✓
5. Add dependency: Task 3 depends on Task 2 ✓
6. Add dependency: Task 1 depends on Task 3 ✗ (Should fail)

**Expected Result:**
- Error: "Circular dependency detected"
- Path: [1, 3, 2, 1]

### Test Case 3: Complex Circular Dependency (4 tasks)
**Setup:**
1. Create Tasks 1, 2, 3, 4
2. Task 2 depends on Task 1 ✓
3. Task 3 depends on Task 2 ✓
4. Task 4 depends on Task 3 ✓
5. Task 1 depends on Task 4 ✗ (Should fail)

**Expected Result:**
- Error: "Circular dependency detected"
- Path: [1, 4, 3, 2, 1]

### Test Case 4: Self-Dependency
**Setup:**
1. Create Task 1
2. Add dependency: Task 1 depends on Task 1 ✗

**Expected Result:**
- Error: "Cannot add a task as a dependency to itself"

### Test Case 5: Valid Complex Dependencies
**Setup:**
```
Task 1 (root)
  ├── Task 2 (depends on 1)
  │   └── Task 4 (depends on 2)
  └── Task 3 (depends on 1)
      └── Task 5 (depends on 3)
```

**All dependencies should succeed:**
1. Task 2 depends on Task 1 ✓
2. Task 3 depends on Task 1 ✓
3. Task 4 depends on Task 2 ✓
4. Task 5 depends on Task 3 ✓

## Automated Test Suite (Django)

Create a file `backend/tests.py`:

```python
from django.test import TestCase
from .models import Task, TaskDependency
from .services import CircularDependencyDetector


class CircularDependencyTestCase(TestCase):
    def setUp(self):
        self.task1 = Task.objects.create(title="Task 1", status="pending")
        self.task2 = Task.objects.create(title="Task 2", status="pending")
        self.task3 = Task.objects.create(title="Task 3", status="pending")
        self.task4 = Task.objects.create(title="Task 4", status="pending")
        self.detector = CircularDependencyDetector(Task, TaskDependency)
    
    def test_simple_cycle_detection(self):
        """Test detection of 2-node cycle"""
        TaskDependency.objects.create(task=self.task2, depends_on=self.task1)
        
        cycle = self.detector.detect_cycle(self.task1.id, self.task2.id)
        self.assertIsNotNone(cycle)
        self.assertIn(self.task1.id, cycle)
        self.assertIn(self.task2.id, cycle)
    
    def test_longer_cycle_detection(self):
        """Test detection of 3-node cycle"""
        TaskDependency.objects.create(task=self.task2, depends_on=self.task1)
        TaskDependency.objects.create(task=self.task3, depends_on=self.task2)
        
        cycle = self.detector.detect_cycle(self.task1.id, self.task3.id)
        self.assertIsNotNone(cycle)
        self.assertEqual(len(cycle), 4)  # [1, 3, 2, 1]
    
    def test_no_cycle(self):
        """Test that valid dependencies don't create cycles"""
        TaskDependency.objects.create(task=self.task2, depends_on=self.task1)
        
        cycle = self.detector.detect_cycle(self.task3.id, self.task2.id)
        self.assertIsNone(cycle)
    
    def test_complex_valid_graph(self):
        """Test complex dependency graph without cycles"""
        TaskDependency.objects.create(task=self.task2, depends_on=self.task1)
        TaskDependency.objects.create(task=self.task3, depends_on=self.task1)
        TaskDependency.objects.create(task=self.task4, depends_on=self.task2)
        
        # Should be able to add more non-cyclic dependencies
        cycle = self.detector.detect_cycle(self.task4.id, self.task3.id)
        self.assertIsNone(cycle)


class StatusUpdateTestCase(TestCase):
    def setUp(self):
        self.task1 = Task.objects.create(title="Task 1", status="completed")
        self.task2 = Task.objects.create(title="Task 2", status="completed")
        self.task3 = Task.objects.create(title="Task 3", status="pending")
    
    def test_status_update_all_completed(self):
        """Test status updates when all dependencies are completed"""
        TaskDependency.objects.create(task=self.task3, depends_on=self.task1)
        TaskDependency.objects.create(task=self.task3, depends_on=self.task2)
        
        self.task3.update_status_based_on_dependencies()
        self.task3.refresh_from_db()
        
        self.assertEqual(self.task3.status, "in_progress")
    
    def test_status_update_blocked(self):
        """Test status updates when a dependency is blocked"""
        self.task1.status = "blocked"
        self.task1.save()
        
        TaskDependency.objects.create(task=self.task3, depends_on=self.task1)
        
        self.task3.update_status_based_on_dependencies()
        self.task3.refresh_from_db()
        
        self.assertEqual(self.task3.status, "blocked")
    
    def test_cascading_status_updates(self):
        """Test that status updates cascade to dependent tasks"""
        task4 = Task.objects.create(title="Task 4", status="pending")
        
        TaskDependency.objects.create(task=self.task3, depends_on=self.task1)
        TaskDependency.objects.create(task=task4, depends_on=self.task3)
        
        # Block task1
        self.task1.status = "blocked"
        self.task1.save()
        self.task1.update_status_based_on_dependencies()
        
        # Check cascading
        for task in [self.task3, task4]:
            task.update_status_based_on_dependencies()
            task.refresh_from_db()
        
        self.assertEqual(self.task3.status, "blocked")
        self.assertEqual(task4.status, "blocked")
```

## API Testing with cURL

### Create Tasks
```bash
# Task 1
curl -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Design Database", "description": "Create ER diagram", "status": "pending"}'

# Task 2
curl -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Implement Backend", "description": "Build Django API", "status": "pending"}'

# Task 3
curl -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Build Frontend", "description": "Create React app", "status": "pending"}'
```

### Add Valid Dependency
```bash
curl -X POST http://localhost:8000/api/dependencies/ \
  -H "Content-Type: application/json" \
  -d '{"task": 2, "depends_on": 1}'
```

### Try to Create Circular Dependency (Should Fail)
```bash
curl -X POST http://localhost:8000/api/dependencies/ \
  -H "Content-Type: application/json" \
  -d '{"task": 1, "depends_on": 2}'
```

Expected Response:
```json
{
  "error": "Circular dependency detected",
  "path": [1, 2, 1]
}
```

### Update Task Status
```bash
curl -X PATCH http://localhost:8000/api/tasks/1/ \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### Get Graph Data
```bash
curl http://localhost:8000/api/tasks/graph/
```

## Performance Testing

Test with 20-30 tasks:

```python
# Create in Django shell
from tasks.models import Task, TaskDependency

# Create 30 tasks
for i in range(1, 31):
    Task.objects.create(
        title=f"Task {i}",
        description=f"Description for task {i}",
        status="pending"
    )

# Create dependencies (tree structure)
for i in range(2, 31):
    parent = (i - 1) // 2
    if parent >= 1:
        TaskDependency.objects.create(
            task_id=i,
            depends_on_id=parent
        )
```

## Run Tests

```bash
# Django tests
python manage.py test tasks

# With coverage
pip install coverage
coverage run --source='.' manage.py test tasks
coverage report
```
