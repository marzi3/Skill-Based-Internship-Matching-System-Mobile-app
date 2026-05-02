import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// Create an Axios instance
const getApiBaseUrl = (): string => {
    // Replace with your actual backend URL. 
    // Use your machine's local IP if testing on a physical device.
    const rawBase = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    return rawBase.endsWith('/api/v1') ? rawBase : `${rawBase}/api/v1`;
};

const apiClient = axios.create({
    baseURL: `${getApiBaseUrl()}/`,
});

// Request Interceptor: Attach Token from SecureStore
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Fix for leading slash causing 404s
        if (config.url && config.url.startsWith('/') && !config.url.startsWith('http')) {
            config.url = config.url.substring(1);
        }

        const token = await SecureStore.getItemAsync('token');
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
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
            
            // Redirect to login using expo-router
            router.replace('/(auth)/login');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
