// src/services/authService.js

export const authService = {
  // Login user - with mock fallback
  async login(email, password) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        throw new Error('API not available');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
      return data;
    } catch (error) {
      console.log('Using mock login:', error.message);
      // Mock login for development
      const mockUser = { id: 'demo-user', email, name: 'Demo User' };
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('userId', mockUser.id);
      return { user: mockUser, token: 'demo-token' };
    }
  },

  // Register user - with mock fallback
  async register(userData) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error('API not available');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
      return data;
    } catch (error) {
      console.log('Using mock registration:', error.message);
      // Mock registration for development
      const mockUser = { id: 'demo-user', ...userData };
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('userId', mockUser.id);
      return { user: mockUser, token: 'demo-token' };
    }
  },

  // Logout user
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('joinedEvents'); // Also clear joined events on logout
  },

  // Get current user
  getCurrentUser() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    return { token, userId };
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};