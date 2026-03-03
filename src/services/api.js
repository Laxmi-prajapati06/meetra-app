// src/services/api.js

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
};

// Auth API
export const authAPI = {
    register: (userData) => apiCall('/auth/register', { method: 'POST', body: userData }),
    login: (credentials) => apiCall('/auth/login', { method: 'POST', body: credentials }),
    getMe: () => apiCall('/auth/me'),
    updateProfile: (profileData) => apiCall('/auth/profile', { method: 'PUT', body: profileData }),
};

// Events API
export const eventsAPI = {
    getEvents: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/events?${queryString}`);
    },
    getEvent: (id) => apiCall(`/events/${id}`),
    createEvent: (eventData) => apiCall('/events', { method: 'POST', body: eventData }),
    joinEvent: (id) => apiCall(`/events/${id}/join`, { method: 'POST' }),
    leaveEvent: (id) => apiCall(`/events/${id}/leave`, { method: 'POST' }),
    getMyEvents: () => apiCall('/events/my-events'),
    updateEvent: (id, eventData) => apiCall(`/events/${id}`, { method: 'PUT', body: eventData }),
    deleteEvent: (id) => apiCall(`/events/${id}`, { method: 'DELETE' }),
};

// Users API
export const usersAPI = {
    getUsers: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/users?${queryString}`);
    },
    getUser: (id) => apiCall(`/users/${id}`),
    connectUser: (id) => apiCall(`/users/${id}/connect`, { method: 'POST' }),
    disconnectUser: (id) => apiCall(`/users/${id}/disconnect`, { method: 'POST' }),
    getSuggestions: () => apiCall('/users/suggestions'),
    planVisit: (place) => apiCall('/users/plan-visit', { method: 'POST', body: place })
    ,
    unplanVisit: (placeId) => apiCall(`/users/plan-visit/${placeId}`, { method: 'DELETE' })
};

// Explore API
export const exploreAPI = {
    getPlaces: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/explore?${queryString}`);
    },
    getPlace: (id) => apiCall(`/explore/${id}`),
    addReview: (id, review) => apiCall(`/explore/${id}/reviews`, { method: 'POST', body: review }),
};

// Messages API
export const messagesAPI = {
    getConversations: () => apiCall('/messages/conversations'),
    getMessages: (userId) => apiCall(`/messages/${userId}`),
    sendMessage: (messageData) => apiCall('/messages', { method: 'POST', body: messageData }),
    markAsRead: (senderId) => apiCall('/messages/read', { method: 'PUT', body: { senderId } }),
};

// Upload API
export const uploadAPI = {
    uploadProfilePicture: async (file) => {
        const token = localStorage.getItem('meetra_token');
        const formData = new FormData();
        formData.append('profilePicture', file);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

        const config = {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
            signal: controller.signal,
        };

        try {
            console.log('[API] Starting profile picture upload...');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/upload/profile-picture`, config);
            clearTimeout(timeoutId);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            console.log('[API] Upload successful');
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                console.error('[API] Upload timeout');
                throw new Error('Upload timed out. The file may be too large or your connection is slow. Try with a smaller image or check your connection.');
            }
            
            console.error('[API] Upload error:', error);
            throw error;
        }
    },
};