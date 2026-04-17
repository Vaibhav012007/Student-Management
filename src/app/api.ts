// API utility functions with authentication
const API_BASE_URL = 'http://localhost:4000/api';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Token expired or invalid, clear auth and reload
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.reload();
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

export const api = {
  // Notes
  getNotes: () => apiRequest('/notes'),
  createNote: (data: any) => apiRequest('/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id: string, data: any) => apiRequest(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id: string) => apiRequest(`/notes/${id}`, { method: 'DELETE' }),

  // Checklist
  getChecklist: () => apiRequest('/checklist'),
  createChecklistItem: (data: any) => apiRequest('/checklist', { method: 'POST', body: JSON.stringify(data) }),
  updateChecklistItem: (id: string, data: any) => apiRequest(`/checklist/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteChecklistItem: (id: string) => apiRequest(`/checklist/${id}`, { method: 'DELETE' }),

  // Exams
  getExams: () => apiRequest('/exams'),
  createExam: (data: any) => apiRequest('/exams', { method: 'POST', body: JSON.stringify(data) }),
  updateExam: (id: string, data: any) => apiRequest(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExam: (id: string) => apiRequest(`/exams/${id}`, { method: 'DELETE' }),

  // Study Plan
  getStudyPlan: () => apiRequest('/study-plan'),
  createStudyPlanItem: (data: any) => apiRequest('/study-plan', { method: 'POST', body: JSON.stringify(data) }),
  updateStudyPlanItem: (id: string, data: any) => apiRequest(`/study-plan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudyPlanItem: (id: string) => apiRequest(`/study-plan/${id}`, { method: 'DELETE' }),

  // Timer State
  getTimerState: () => apiRequest('/timer-state'),
  updateTimerState: (data: any) => apiRequest('/timer-state', { method: 'PUT', body: JSON.stringify(data) }),
};