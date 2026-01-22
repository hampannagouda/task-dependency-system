from typing import List, Set, Optional


class CircularDependencyDetector:
    """
    Detects circular dependencies using Depth-First Search (DFS) algorithm.
    """
    
    def __init__(self, task_model, dependency_model):
        self.Task = task_model
        self.TaskDependency = dependency_model
    
    def detect_cycle(self, task_id: int, depends_on_id: int) -> Optional[List[int]]:
        """
        Detects if adding a dependency would create a circular dependency.
        
        Args:
            task_id: The task that will depend on another task
            depends_on_id: The task that task_id will depend on
        
        Returns:
            List of task IDs forming the cycle if found, None otherwise
        """
        # Check if adding this dependency creates a cycle
        # We need to check if depends_on_id can reach task_id through existing dependencies
        
        visited = set()
        path = []
        
        if self._dfs_has_path(depends_on_id, task_id, visited, path):
            # Add the new edge to complete the cycle
            path.append(task_id)
            return path
        
        return None
    
    def _dfs_has_path(self, current_id: int, target_id: int, visited: Set[int], path: List[int]) -> bool:
        """
        DFS to check if there's a path from current_id to target_id.
        
        Returns:
            True if path exists, False otherwise. Path is modified in-place.
        """
        if current_id == target_id:
            return True
        
        if current_id in visited:
            return False
        
        visited.add(current_id)
        path.append(current_id)
        
        # Get all tasks that current task depends on
        dependencies = self.TaskDependency.objects.filter(task_id=current_id)
        
        for dependency in dependencies:
            if self._dfs_has_path(dependency.depends_on_id, target_id, visited, path):
                return True
        
        # Backtrack
        path.pop()
        return False
    
    def get_all_cycles(self) -> List[List[int]]:
        """
        Finds all cycles in the current dependency graph.
        
        Returns:
            List of cycles, where each cycle is a list of task IDs
        """
        all_tasks = self.Task.objects.all()
        visited = set()
        cycles = []
        
        for task in all_tasks:
            if task.id not in visited:
                path = []
                rec_stack = set()
                self._find_cycles_dfs(task.id, visited, rec_stack, path, cycles)
        
        return cycles
    
    def _find_cycles_dfs(self, current_id: int, visited: Set[int], rec_stack: Set[int], 
                         path: List[int], cycles: List[List[int]]):
        """
        DFS helper to find all cycles in the graph.
        """
        visited.add(current_id)
        rec_stack.add(current_id)
        path.append(current_id)
        
        dependencies = self.TaskDependency.objects.filter(task_id=current_id)
        
        for dependency in dependencies:
            next_id = dependency.depends_on_id
            
            if next_id not in visited:
                self._find_cycles_dfs(next_id, visited, rec_stack, path, cycles)
            elif next_id in rec_stack:
                # Found a cycle
                cycle_start = path.index(next_id)
                cycle = path[cycle_start:] + [next_id]
                cycles.append(cycle)
        
        path.pop()
        rec_stack.remove(current_id)
