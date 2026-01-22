import React, { useState } from 'react';

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-700 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
  blocked: 'bg-red-100 text-red-700 border-red-300',
};

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
};

const TaskItem = ({
  task,
  tasks,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
  onUpdateTask,
  onDeleteTask,
  onAddDependency,
  onRemoveDependency,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [selectedDependency, setSelectedDependency] = useState('');
  const [showDependencyForm, setShowDependencyForm] = useState(false);
  const [dependencyError, setDependencyError] = useState(null);

  const handleStatusChange = async (newStatus) => {
    try {
      await onUpdateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await onUpdateTask(task.id, {
        title: editedTitle,
        description: editedDescription,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedDependency) return;

    setDependencyError(null);
    const result = await onAddDependency(task.id, parseInt(selectedDependency));

    if (!result.success) {
      if (result.error === 'Circular dependency detected') {
        setDependencyError({
          message: 'Cannot add dependency: This would create a circular dependency',
          path: result.path,
        });
      } else {
        setDependencyError({
          message: result.error || 'Failed to add dependency',
        });
      }
      return;
    }

    setSelectedDependency('');
    setShowDependencyForm(false);
    setDependencyError(null);
  };

  const availableDependencies = tasks.filter(
    t => t.id !== task.id && !task.dependencies.includes(t.id)
  );

  const getDependencyTasks = () => {
    return tasks.filter(t => task.dependencies.includes(t.id));
  };

  const getDependentTasks = () => {
    return tasks.filter(t => task.dependents.includes(t.id));
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 transition ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
      } ${STATUS_COLORS[task.status]}`}
      onClick={() => onSelect(task.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit();
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                    setEditedTitle(task.title);
                    setEditedDescription(task.description);
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-1">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              )}
            </>
          )}

          <div className="flex items-center gap-2 mt-2">
            <select
              value={task.status}
              onChange={(e) => {
                e.stopPropagation();
                handleStatusChange(e.target.value);
              }}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <span className="text-xs text-gray-500">
              ID: {task.id}
            </span>
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(task.id);
            }}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-300" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-4">
            {/* Dependencies Section */}
            <div>
              <h4 className="font-semibold mb-2 text-sm">
                Dependencies ({getDependencyTasks().length})
              </h4>
              {getDependencyTasks().length > 0 ? (
                <ul className="space-y-1">
                  {getDependencyTasks().map(dep => (
                    <li key={dep.id} className="flex items-center justify-between text-sm bg-white bg-opacity-50 p-2 rounded">
                      <span>
                        {dep.title} - <span className="text-xs">{STATUS_LABELS[dep.status]}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No dependencies</p>
              )}

              {!showDependencyForm ? (
                <button
                  onClick={() => setShowDependencyForm(true)}
                  className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  disabled={availableDependencies.length === 0}
                >
                  Add Dependency
                </button>
              ) : (
                <div className="mt-2 space-y-2">
                  <select
                    value={selectedDependency}
                    onChange={(e) => setSelectedDependency(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="">Select a task...</option>
                    {availableDependencies.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  {dependencyError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      <p className="font-semibold">{dependencyError.message}</p>
                      {dependencyError.path && (
                        <p className="mt-1">
                          Cycle path: {dependencyError.path.join(' → ')}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddDependency}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      disabled={!selectedDependency}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowDependencyForm(false);
                        setSelectedDependency('');
                        setDependencyError(null);
                      }}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Blocks Section */}
            {getDependentTasks().length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm text-orange-700">
                  Blocking Tasks ({getDependentTasks().length})
                </h4>
                <ul className="space-y-1">
                  {getDependentTasks().map(dep => (
                    <li key={dep.id} className="text-sm bg-orange-50 p-2 rounded">
                      {dep.title} - <span className="text-xs">{STATUS_LABELS[dep.status]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
