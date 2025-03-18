import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://13.126.230.108:3001/api';

// Custom config type with retry properties
interface CustomAxiosConfig extends AxiosRequestConfig {
  retryCount?: number;
  maxRetries?: number;
  retryDelay?: number;
}

interface CustomInternalAxiosConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  severity?: 'error' | 'warning' | 'info' | 'success';
}

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 500
});

// Request interceptor for handling retries
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const customConfig = config as CustomInternalAxiosConfig;
    // Add CORS headers
    customConfig.headers['Access-Control-Allow-Origin'] = '*';
    customConfig.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    
    return {
      ...customConfig,
      retryCount: customConfig.retryCount || 0,
      maxRetries: customConfig.maxRetries || 3,
      retryDelay: customConfig.retryDelay || 1000,
    } as InternalAxiosRequestConfig;
  },
  (error) => Promise.reject(formatError(error))
);

// Response interceptor for handling errors and retries
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as CustomInternalAxiosConfig;
    
    // Don't retry on certain status codes
    if (error.response?.status === 401 || error.response?.status === 403) {
      return Promise.reject(formatError(error));
    }

    // Check if we should retry the request
    if (config?.retryCount !== undefined && 
        config?.maxRetries !== undefined && 
        config?.retryDelay !== undefined && 
        config.retryCount < config.maxRetries) {
      config.retryCount += 1;
      
      // Exponential backoff delay
      const delay = config.retryDelay * Math.pow(2, config.retryCount - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retrying request (${config.retryCount}/${config.maxRetries})`);
      return apiClient(config);
    }

    return Promise.reject(formatError(error));
  }
);

// Format error response
function formatError(error: AxiosError): ApiError {
  if (error.response) {
    // Server responded with error
    const data = error.response.data as { message?: string };
    return {
      message: data.message || 'Server error occurred',
      code: 'SERVER_ERROR',
      status: error.response.status,
      details: error.response.data
    };
  } else if (error.request) {
    // Request made but no response
    console.error('Network Error:', error.request);
    return {
      message: 'No response from server. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      details: error.request
    };
  } else {
    // Request setup error
    console.error('Request Error:', error.message);
    return {
      message: error.message || 'An error occurred while setting up the request',
      code: 'REQUEST_ERROR'
    };
  }
}

// Cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// API methods with enhanced error handling
export const api = {
  async get<T>(url: string, config?: CustomAxiosConfig & { skipCache?: boolean }): Promise<T> {
    try {
      const cacheKey = `GET:${url}`;
      const cached = cache.get(cacheKey);

      if (!config?.skipCache && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const response = await apiClient.get<T>(url, config);
      
      if (!config?.skipCache) {
        cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
      }

      return response.data;
    } catch (error) {
      throw formatError(error as AxiosError);
    }
  },

  async post<T>(url: string, data?: any, config?: CustomAxiosConfig): Promise<T> {
    try {
      const response = await apiClient.post<T>(url, data, {
        ...config,
        headers: {
          ...config?.headers,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw formatError(error as AxiosError);
    }
  },

  async put<T>(url: string, data?: any, config?: CustomAxiosConfig): Promise<T> {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw formatError(error as AxiosError);
    }
  },

  async delete<T>(url: string, config?: CustomAxiosConfig): Promise<T> {
    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw formatError(error as AxiosError);
    }
  },

  clearCache() {
    cache.clear();
  },

  invalidateCache(url: string) {
    const cacheKey = `GET:${url}`;
    cache.delete(cacheKey);
  }
};

export default api; 