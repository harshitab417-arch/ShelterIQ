import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('drdo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const socket = io(window.location.origin, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

export default api;
