import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api'
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('yaleclubs_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('yaleclubs_token');
  }
}

export function getStoredToken() {
  return localStorage.getItem('yaleclubs_token');
}

export default api;
