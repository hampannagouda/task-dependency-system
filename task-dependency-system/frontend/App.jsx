import React, { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import DependencyGraph from './components/DependencyGraph';
import { getTasks, createTask, updateTask, deleteTask, addDependency, removeDependency, getGraphData } from './api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTasks();
    loadGraphData();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGraphData = async () => {
    try {
      const data = await getGraphData();
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load graph data:', err);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      setLoading(true);
      await createTask(taskData);
      await loadTasks();
      await loadGraphData();
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      setLoading(true);
      await updateTask(taskId, taskData);
      await loadTasks();
      await loadGraphData();
      setError(null);
    } catch (err) {
      setError('Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteTask(taskId);
      await loadTasks();
      await loadGraphData();
      setError(null);
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDependency = async (taskId, dependsOnId) => {
    try {
      setLoading(true);
      await addDependency(taskId, dependsOnId);
      await loadTasks();
      await loadGraphData();
      setError(null);
      return { success: true };
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.error === 'Circular dependency detected') {
        return {
          success: false,
          error: errorData.error,
          path: errorData.path
        };
      }
      setError('Failed to add dependency');
      return { success: false, error: 'Failed to add dependency' };
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDependency = async (dependencyId) => {
    try {
      setLoading(true);
      await removeDependency(dependencyId);
      await loadTasks();
      await loadGraphData();
      setError(null);
    } catch (err) {
      setError('Failed to remove dependency');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Task Dependency Management System
          </h1>
          <p className="text-gray-600">
            Manage tasks with automatic dependency tracking and circular dependency prevention
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Tasks</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  {showForm ? 'Cancel' : 'Add Task'}
                </button>
              </div>

              {showForm && (
                <div className="mb-6">
                  <TaskForm
                    onSubmit={handleCreateTask}
                    onCancel={() => setShowForm(false)}
                  />
                </div>
              )}

              {loading && tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tasks yet. Create your first task to get started!
                </div>
              ) : (
                <TaskList
                  tasks={tasks}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onAddDependency={handleAddDependency}
                  onRemoveDependency={handleRemoveDependency}
                  selectedTask={selectedTask}
                  onSelectTask={setSelectedTask}
                />
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Dependency Graph
              </h2>
              <DependencyGraph
                graphData={graphData}
                selectedTask={selectedTask}
                onSelectTask={setSelectedTask}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
