// src/components/SignIn.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './SignIn.css';

const SignIn = ({ setCurrentPage, setIsLoggedIn }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    collegeId: '',
    enrollmentNumber: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.email) {
      setError('Email is required');
      return false;
    }

    if (!formData.email.endsWith('@medicaps.ac.in')) {
      setError('Please use your Medicaps University email address');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (!isLogin) {
      if (!formData.username) {
        setError('Username is required');
        return false;
      }
      if (!formData.collegeId) {
        setError('College ID is required');
        return false;
      }
      if (!formData.enrollmentNumber) {
        setError('Enrollment number is required');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      let result;
      
      if (isLogin) {
        console.log('Attempting login...');
        result = await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        console.log('Attempting registration...');
        result = await register({
          username: formData.username,
          email: formData.email,
          collegeId: formData.collegeId,
          enrollmentNumber: formData.enrollmentNumber,
          password: formData.password
        });
      }

      if (result.success) {
        console.log('Authentication successful!');
        setIsLoggedIn(true);
        setCurrentPage('profile');
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <h1>{isLogin ? 'Sign In to Meetra' : 'Join Meetra'}</h1>
        <p>Exclusive for Medicaps University students</p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signin-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder="johndoe"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="collegeId">College ID</label>
                <input
                  type="text"
                  id="collegeId"
                  name="collegeId"
                  value={formData.collegeId}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder="2200528"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="enrollmentNumber">Enrollment Number</label>
                <input
                  type="text"
                  id="enrollmentNumber"
                  name="enrollmentNumber"
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder="EN22IT301031"
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="email">College Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="en22it301031@medicaps.ac.in"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength="6"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span 
              className="switch-link"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;