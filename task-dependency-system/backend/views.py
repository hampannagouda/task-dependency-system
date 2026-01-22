from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Task, TaskDependency
from .serializers import (
    TaskSerializer, TaskDependencySerializer, 
    TaskCreateSerializer, TaskUpdateSerializer
)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TaskUpdateSerializer
        return TaskSerializer
    
    def list(self, request, *args, **kwargs):
        """List all tasks"""
        queryset = self.get_queryset()
        serializer = TaskSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Create a new task"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(
            TaskSerializer(task).data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Update a task"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(TaskSerializer(task).data)
    
    @action(detail=True, methods=['delete'])
    def destroy_with_warning(self, request, pk=None):
        """Delete a task with dependency warning"""
        task = self.get_object()
        dependents = task.get_dependents()
        
        if dependents.exists():
            dependent_tasks = TaskSerializer(dependents, many=True).data
            return Response({
                'warning': 'Other tasks depend on this task',
                'affected_tasks': dependent_tasks,
                'count': dependents.count()
            }, status=status.HTTP_200_OK)
        
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def graph(self, request):
        """Get graph data for visualization"""
        tasks = Task.objects.all()
        dependencies = TaskDependency.objects.all()
        
        nodes = []
        edges = []
        
        for task in tasks:
            nodes.append({
                'id': task.id,
                'title': task.title,
                'status': task.status
            })
        
        for dep in dependencies:
            edges.append({
                'from': dep.task_id,
                'to': dep.depends_on_id
            })
        
        return Response({
            'nodes': nodes,
            'edges': edges
        })


class TaskDependencyViewSet(viewsets.ModelViewSet):
    queryset = TaskDependency.objects.all()
    serializer_class = TaskDependencySerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Add a dependency with circular dependency check"""
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            dependency = serializer.save()
            
            # Update status of the task based on new dependency
            task = dependency.task
            task.update_status_based_on_dependencies()
            
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
        except serializers.ValidationError as e:
            # Return error with path if circular dependency detected
            error_detail = e.detail
            if isinstance(error_detail, dict) and 'error' in error_detail:
                return Response(
                    error_detail,
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        """Remove a dependency"""
        dependency = self.get_object()
        task = dependency.task
        dependency.delete()
        
        # Update task status after removing dependency
        task.update_status_based_on_dependencies()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
