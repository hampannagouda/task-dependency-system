from django.db import models
from django.utils import timezone


class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.status})"
    
    def get_dependencies(self):
        """Get all tasks this task depends on"""
        return Task.objects.filter(
            id__in=self.dependencies.values_list('depends_on_id', flat=True)
        )
    
    def get_dependents(self):
        """Get all tasks that depend on this task"""
        return Task.objects.filter(
            id__in=TaskDependency.objects.filter(depends_on=self).values_list('task_id', flat=True)
        )
    
    def update_status_based_on_dependencies(self):
        """Auto-update status based on dependency completion"""
        dependencies = self.get_dependencies()
        
        if not dependencies.exists():
            return
        
        # Check if any dependency is blocked
        if dependencies.filter(status='blocked').exists():
            if self.status != 'blocked':
                self.status = 'blocked'
                self.save()
                # Cascade to dependents
                for dependent in self.get_dependents():
                    dependent.update_status_based_on_dependencies()
        
        # Check if all dependencies are completed
        elif dependencies.filter(status='completed').count() == dependencies.count():
            if self.status == 'pending':
                self.status = 'in_progress'
                self.save()


class TaskDependency(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='dependencies')
    depends_on = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='dependents')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'task_dependencies'
        unique_together = ('task', 'depends_on')
    
    def __str__(self):
        return f"{self.task.title} depends on {self.depends_on.title}"
