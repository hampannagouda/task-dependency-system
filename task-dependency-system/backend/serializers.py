from rest_framework import serializers
from .models import Task, TaskDependency
from .services import CircularDependencyDetector


class TaskSerializer(serializers.ModelSerializer):
    dependencies = serializers.SerializerMethodField()
    dependents = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'created_at', 'updated_at', 
                  'dependencies', 'dependents']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_dependencies(self, obj):
        """Get list of task IDs this task depends on"""
        return list(obj.dependencies.values_list('depends_on_id', flat=True))
    
    def get_dependents(self, obj):
        """Get list of task IDs that depend on this task"""
        return list(TaskDependency.objects.filter(depends_on=obj).values_list('task_id', flat=True))


class TaskDependencySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskDependency
        fields = ['id', 'task', 'depends_on', 'created_at']
        read_only_fields = ['created_at']
    
    def validate(self, data):
        """
        Check that the dependency doesn't create a circular dependency.
        """
        task = data.get('task')
        depends_on = data.get('depends_on')
        
        # Check if task is trying to depend on itself
        if task.id == depends_on.id:
            raise serializers.ValidationError({
                'error': 'Cannot add a task as a dependency to itself',
                'path': None
            })
        
        # Check if this dependency already exists
        if TaskDependency.objects.filter(task=task, depends_on=depends_on).exists():
            raise serializers.ValidationError({
                'error': 'This dependency already exists',
                'path': None
            })
        
        # Check for circular dependency
        detector = CircularDependencyDetector(Task, TaskDependency)
        cycle_path = detector.detect_cycle(task.id, depends_on.id)
        
        if cycle_path:
            raise serializers.ValidationError({
                'error': 'Circular dependency detected',
                'path': cycle_path
            })
        
        return data


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['title', 'description', 'status']


class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['title', 'description', 'status']
    
    def update(self, instance, validated_data):
        """Update task and trigger cascading status updates"""
        old_status = instance.status
        instance = super().update(instance, validated_data)
        new_status = instance.status
        
        # If task was completed, update dependent tasks
        if old_status != 'completed' and new_status == 'completed':
            for dependent in instance.get_dependents():
                dependent.update_status_based_on_dependencies()
        
        # If task was blocked, cascade to dependents
        if old_status != 'blocked' and new_status == 'blocked':
            for dependent in instance.get_dependents():
                dependent.update_status_based_on_dependencies()
        
        return instance
