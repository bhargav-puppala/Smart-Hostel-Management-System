import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const UPLOAD_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || '';

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${UPLOAD_BASE || ''}${path.startsWith('/') ? path : `/${path}`}`;
};

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
};

export const hostelsApi = {
  getAll: (params) => api.get('/hostels', { params }),
  getOne: (id) => api.get(`/hostels/${id}`),
  create: (data) => api.post('/hostels', data),
  update: (id, data) => api.patch(`/hostels/${id}`, data),
  delete: (id) => api.delete(`/hostels/${id}`),
};

export const roomsApi = {
  getAll: (params) => api.get('/rooms', { params }),
  getOne: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.patch(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  approveWarden: (id) => api.patch(`/users/${id}/approve`),
  rejectWarden: (id) => api.patch(`/users/${id}/reject`),
};

export const feesApi = {
  getAll: (params) => api.get('/fees', { params }),
  getOne: (id) => api.get(`/fees/${id}`),
  create: (data) => api.post('/fees', data),
  pay: (id) => api.patch(`/fees/${id}/pay`),
};

export const complaintsApi = {
  getAll: (params) => api.get('/complaints', { params }),
  getOne: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  resolve: (id, data) => api.patch(`/complaints/${id}/resolve`, data),
};

export const statsApi = {
  get: () => api.get('/stats'),
};

export const announcementsApi = {
  getAll: (params) => api.get('/announcements', { params }),
  getOne: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.patch(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

export const allotmentsApi = {
  getAll: (params) => api.get('/allotments', { params }),
  getOne: (id) => api.get(`/allotments/${id}`),
  create: (data) => api.post('/allotments', data),
  end: (id) => api.patch(`/allotments/${id}/end`),
};

export const uploadApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
