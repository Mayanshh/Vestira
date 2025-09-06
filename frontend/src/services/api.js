import axios from 'axios';
import toast from 'react-hot-toast';
import { retryWithBackoff, safeLocalStorage } from '../utils/performance';

// Dynamic backend API base URL for Replit environment
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return '/api';
  }
  
  // Use relative URLs for API calls - they will be proxied by Vite
  return '/api';
};

const API_URL = getApiUrl();

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based auth
  timeout: 30000, // 30 second timeout for regular requests
});

// Create a separate instance for file uploads with longer timeout
const uploadAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 120000, // 2 minutes for uploads
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024, // 50MB
});

// Request interceptor to add auth token
const requestInterceptor = (config) => {
  const token = safeLocalStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add request ID for debugging
  config.metadata = { startTime: new Date() };
  
  return config;
};

const requestErrorInterceptor = (error) => {
  console.error('Request failed:', error);
  return Promise.reject(error);
};

api.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
uploadAPI.interceptors.request.use(requestInterceptor, requestErrorInterceptor);

// Response interceptor for error handling
const responseInterceptor = (response) => {
  return response;
};

const errorInterceptor = (error) => {
  // Network error handling
  if (!error.response) {
    console.error('Network error:', error);
    toast.error('Network connection failed. Please check your internet connection.');
    return Promise.reject(error);
  }
  
  const message = error.response?.data?.message || 'An error occurred';
  const status = error.response?.status;
  
  // Handle different error codes
  switch (status) {
    case 401:
      // Clear auth data on unauthorized
      safeLocalStorage.removeItem('token');
      safeLocalStorage.removeItem('user');
      safeLocalStorage.removeItem('userType');
      
      // Avoid infinite redirects
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
      break;
      
    case 403:
      toast.error('You do not have permission to perform this action');
      break;
      
    case 404:
      if (!error.config?.url?.includes('/auth/')) {
        toast.error('The requested resource was not found');
      }
      break;
      
    case 429:
      toast.error('Too many requests. Please slow down and try again.');
      break;
      
    case 500:
    case 502:
    case 503:
      toast.error('Server error. Please try again in a moment.');
      break;
      
    default:
      // Don't show duplicate toast errors for auth endpoints or upload endpoints
      if (status >= 400 && 
          status !== 401 && 
          !error.config?.url?.includes('/auth/') &&
          !error.config?.url?.includes('/upload')) {
        toast.error(message);
      }
  }
  
  return Promise.reject(error);
};

api.interceptors.response.use(responseInterceptor, errorInterceptor);
uploadAPI.interceptors.response.use(responseInterceptor, errorInterceptor);

// Authentication API calls with retry logic
export const authAPI = {
  // User authentication
  registerUser: (userData) => retryWithBackoff(() => api.post('/auth/user/register', userData), 2),
  loginUser: (credentials) => retryWithBackoff(() => api.post('/auth/user/login', credentials), 2),
  logoutUser: () => api.get('/auth/user/logout'),
  
  // Partner authentication
  registerPartner: (partnerData) => retryWithBackoff(() => api.post('/auth/partner/register', partnerData), 2),
  loginPartner: (credentials) => retryWithBackoff(() => api.post('/auth/partner/login', credentials), 2),
  logoutPartner: () => api.get('/auth/partner/logout'),
};

// Reels API calls
export const reelsAPI = {
  // Get all reels with pagination
  getReels: (page = 1, limit = 10) => 
    api.get(`/reels?page=${page}&limit=${limit}`),
  
  // Upload new reel (partners only) - using upload API for longer timeout
  uploadReel: (reelData) => uploadAPI.post('/reels/upload', reelData),
  
  // Like/unlike reel
  toggleLike: (reelId) => api.post(`/reels/${reelId}/like`),
  
  // Save/unsave reel
  toggleSave: (reelId) => api.post(`/reels/${reelId}/save`),
  
  // Add comment to reel
  addComment: (reelId, text) => 
    api.post(`/reels/${reelId}/comment`, { text }),
};

// User profile API calls
export const userAPI = {
  // Get user profile with liked and saved reels
  getProfile: () => api.get('/user/profile'),
};

// Order API calls
export const orderAPI = {
  // Place new order
  placeOrder: (orderData) => api.post('/orders', orderData),
  // Get user's orders
  getUserOrders: () => api.get('/orders'),
};

// Partner profile API calls
export const partnerAPI = {
  // Get partner profile
  getProfile: () => api.get('/partner/profile'),
  // Update partner profile
  updateProfile: (data) => api.put('/partner/profile', data),
  // Get partner's reels
  getMyReels: () => api.get('/reels/partner'),
  // Delete partner's reel
  deleteReel: (reelId) => api.delete(`/reels/${reelId}`),
  // Update partner's reel
  updateReel: (reelId, data) => api.put(`/reels/${reelId}`, data),
  // Get partner orders
  getOrders: () => api.get('/orders/partner'),
  // Update order status
  updateOrderStatus: (orderId, status) => api.patch(`/orders/${orderId}/status`, { status }),
  // Get analytics
  getAnalytics: () => api.get('/auth/partner/analytics'),
};

// Utility function to handle file uploads
export const uploadFile = async (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default api;