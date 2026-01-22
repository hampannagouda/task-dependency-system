import React, { useState } from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ 
  tasks, 
  onUpdateTask, 
  onDeleteTask, 
  onAddDependency, 
  onRemoveDependency,
  selectedTask,
  onSelectTask 
}) => {
  const [expandedTask, setExpandedTask] = useState(null);

  const handleToggleExpand = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No tasks available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          tasks={tasks}
          isExpanded={expandedTask === task.id}
          isSelected={selectedTask === task.id}
          onToggleExpand={handleToggleExpand}
          onSelect={onSelectTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onAddDependency={onAddDependency}
          onRemoveDependency={onRemoveDependency}
        />
      ))}
    </div>
  );
};

export default TaskList;
