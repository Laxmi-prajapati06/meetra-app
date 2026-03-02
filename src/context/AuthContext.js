// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Enhanced API call function with better error handling
const apiCall = async (endpoint, options = {}) => {
// ... (apiCall function remains unchanged)
    const token = localStorage.getItem('meetra_token');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        console.log(`API Call: ${endpoint}`, config);
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        
        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(text || 'Server error');
        }

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
};

// Auth API
const authAPI = {
    register: (userData) => apiCall('/auth/register', { method: 'POST', body: userData }),
    login: (credentials) => apiCall('/auth/login', { method: 'POST', body: credentials }),
    getMe: () => apiCall('/auth/me'),
    updateProfile: (profileData) => apiCall('/auth/profile', { method: 'PUT', body: profileData }),
};

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // NEW: Function to fetch the latest user data and update context
    const refreshUser = async () => {
        try {
            const response = await authAPI.getMe();
            setUser(response.data);
            setIsAuthenticated(true);
            return response.data;
        } catch (error) {
            console.error('User refresh failed:', error);
            localStorage.removeItem('meetra_token');
            setUser(null);
            setIsAuthenticated(false);
            return null;
        }
    };
    const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('meetra_token');
    if (token) {
        try {
            await refreshUser();
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
    setLoading(false);
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);


    const login = async (credentials) => {
// ... (login function remains largely unchanged, relies on getMe for full user data on next checkAuthStatus)
        try {
            console.log('Login attempt:', credentials.email);
            const response = await authAPI.login(credentials);
            const { data } = response;
            
            if (data && data.token) {
                localStorage.setItem('meetra_token', data.token);
                
                // Immediately fetch full populated user data after login
                const fullUser = await refreshUser(); 

                if (fullUser) {
                    console.log('Login successful:', fullUser.username);
                    return { success: true, data: fullUser };
                }
                
                return { success: true, data }; // Fallback if refresh fails
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Login failed:', error);
            return { 
                success: false, 
                error: error.message || 'Login failed. Please try again.' 
            };
        }
    };

    const register = async (userData) => {
        try {
            console.log('Registration attempt:', userData.email);
            const response = await authAPI.register(userData);
            const { data } = response;
            
            if (data && data.token) {
                localStorage.setItem('meetra_token', data.token);
                
                // Immediately fetch full populated user data after registration
                const fullUser = await refreshUser();

                if (fullUser) {
                    console.log('Registration successful:', fullUser.username);
                    return { success: true, data: fullUser };
                }

                return { success: true, data }; // Fallback if refresh fails
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Registration failed:', error);
            return { 
                success: false, 
                error: error.message || 'Registration failed. Please try again.' 
            };
        }
    };

    const logout = () => {
        console.log('Logging out user:', user?.username);
        localStorage.removeItem('meetra_token');
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    const updateProfile = async (profileData) => {
        try {
            const token = localStorage.getItem('meetra_token');
            const res = await fetch(`${API_BASE}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify(profileData)
            });

            const text = await res.text();
            let data;
            try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

            if (!res.ok) {
                console.error('updateProfile failed:', res.status, data);
                return { success: false, status: res.status, error: (data && data.message) || text || 'Update failed', raw: data };
            }

            // Backend returns { success, data }
            const userData = data?.data || data;
            if (userData) {
                // After updating profile, fetch the fully populated user
                const fullUser = await refreshUser();
                if (fullUser) {
                    return { success: true, data: fullUser };
                }

                // Fallback: if refresh failed, use returned userData
                setUser(userData);
                return { success: true, data: userData };
            }

            return { success: false, error: 'No data returned', raw: data };
        } catch (error) {
            console.error('updateProfile error:', error);
            return { success: false, error: error.message || 'Update failed' };
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        updateProfile,
        checkAuthStatus,
        refreshUser // NEW: Expose refreshUser to components
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};