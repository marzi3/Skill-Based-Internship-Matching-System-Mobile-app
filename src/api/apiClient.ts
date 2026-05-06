import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';

const getApiBaseUrl = (): string => {
    // On web, requests go through cors-proxy.js (port 5001) to avoid CORS restrictions.
    // On native, connect directly to the backend (port 5000).
    const defaultUrl = Platform.OS === 'web' ? 'http://localhost:5001' : 'http://localhost:5000';
    const rawBase = (process.env.EXPO_PUBLIC_API_URL || defaultUrl).replace(/\/$/, '');
    return rawBase.endsWith('/api/v1') ? rawBase : `${rawBase}/api/v1`;
};

const apiClient = axios.create({
    baseURL: `${getApiBaseUrl()}/`,
    timeout: 10000, // 10s timeout to help distinguish slow responses from immediate network failures
});

// Request Interceptor: Attach Token from SecureStore
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Fix for leading slash causing 404s
        if (config.url && config.url.startsWith('/') && !config.url.startsWith('http')) {
            config.url = config.url.substring(1);
        }

        const token = await storage.getItem('token');
        if (token) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401 Unauthorized globally
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        if (error.response && error.response.status === 401) {
            await storage.deleteItem('token');
            await storage.deleteItem('user');
            
            // Redirect to login using expo-router
            router.replace('/(auth)/login');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
