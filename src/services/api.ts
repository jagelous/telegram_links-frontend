import axios from 'axios';
import { TelegramLink, CreateTelegramLinkData, UpdateTelegramLinkData, ApiResponse } from '../types/telegramLink';

// Use proxy in development, direct URL in production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://longlifecoin.com/api' 
  : '/api';

console.log('Environment:', process.env.NODE_ENV);
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const telegramLinkService = {
  getTelegramLinks: async (page = 1, limit = 10, search = ''): Promise<ApiResponse<TelegramLink[]>> => {
    const response = await api.get(`/telegram-links?page=${page}&limit=${limit}&search=${search}`);
    return response.data;
  },

  // Get single telegram link
  getTelegramLink: async (id: string): Promise<ApiResponse<TelegramLink>> => {
    const response = await api.get(`/telegram-links/${id}`);
    return response.data;
  },

  // Create new telegram link
  createTelegramLink: async (data: CreateTelegramLinkData): Promise<ApiResponse<TelegramLink>> => {
    const response = await api.post('/telegram-links', data);
    return response.data;
  },

  // Update telegram link
  updateTelegramLink: async (id: string, data: UpdateTelegramLinkData): Promise<ApiResponse<TelegramLink>> => {
    const response = await api.put(`/telegram-links/${id}`, data);
    return response.data;
  },

  // Delete telegram link
  deleteTelegramLink: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/telegram-links/${id}`);
    return response.data;
  },

  // Get unique owner names
  getOwnerNames: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get('/telegram-links/owners');
    return response.data;
  },
};

export default api;
