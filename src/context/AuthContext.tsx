import { router } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import apiClient from '../api/apiClient';
import { storage } from '../utils/storage';

export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'student' | 'employer' | 'admin';
    isVerified?: boolean;
    token?: string;
    [key: string]: any;
}

interface AuthResponse {
    success: boolean;
    error?: string;
    data?: any;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<AuthResponse>;
    register: (userData: any) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    checkUserLoggedIn: () => Promise<void>;
    getRoleDashboard: (role: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getRoleDashboard = (role: string): string => {
    return '/(tabs)';
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const syncUserToStorage = async (userData: User | null) => {
        if (userData) {
            await storage.setItem('user', JSON.stringify(userData));
            if (userData.token) {
                await storage.setItem('token', userData.token);
            }
        } else {
            await storage.deleteItem('user');
            await storage.deleteItem('token');
        }
    };

    const checkUserLoggedIn = async () => {
        try {
            const token = await storage.getItem('token');
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            const { data } = await apiClient.get<User>('/auth/me');
            setUser(data);
            await syncUserToStorage(data);
        } catch (error) {
            setUser(null);
            await syncUserToStorage(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const login = async (email: string, password: string): Promise<AuthResponse> => {
        try {
            const credentials = {
                email: String(email || '').trim().toLowerCase(),
                password: String(password || '').trim(),
            };

            const { data } = await apiClient.post<User>('/auth/login', credentials);

            if (data.token) {
                await storage.setItem('token', data.token);
            }

            setUser(data);
            await syncUserToStorage(data);
            router.replace(getRoleDashboard(data.role) as any);
            return { success: true };
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            return { success: false, error: errorMessage };
        }
    };

    const register = async (userData: any): Promise<AuthResponse> => {
        try {
            const { data } = await apiClient.post<User>('/auth/register', userData);

            if (data.token) {
                await storage.setItem('token', data.token);
            }

            setUser(data);
            await syncUserToStorage(data);
            router.replace('/(tabs)');
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = async (): Promise<void> => {
        const redirectToLogin = () => {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.location.replace('/login');
                return;
            }

            router.replace('/(auth)/login');
        };

        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            setUser(null);
            await syncUserToStorage(null);
            redirectToLogin();
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            isAuthenticated: !!user, 
            login, 
            register, 
            logout, 
            checkUserLoggedIn, 
            getRoleDashboard 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
