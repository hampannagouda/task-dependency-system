const API_BASE_URL = 'http://localhost:8000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw { response: { data: error } };
  }

  return response.json();
}

// Task APIs
export async function getTasks() {
  return apiCall('/tasks/');
}

export async function getTask(id) {
  return apiCall(`/tasks/${id}/`);
}

export async function createTask(taskData) {
  return apiCall('/tasks/', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function updateTask(id, taskData) {
  return apiCall(`/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(taskData),
  });
}

export async function deleteTask(id) {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
  
  return response.status === 204 ? null : response.json();
}

// Dependency APIs
export async function addDependency(taskId, dependsOnId) {
  return apiCall('/dependencies/', {
    method: 'POST',
    body: JSON.stringify({
      task: taskId,
      depends_on: dependsOnId,
    }),
  });
}

export async function removeDependency(dependencyId) {
  const response = await fetch(`${API_BASE_URL}/dependencies/${dependencyId}/`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove dependency');
  }
  
  return null;
}

// Graph API
export async function getGraphData() {
  return apiCall('/tasks/graph/');
}
