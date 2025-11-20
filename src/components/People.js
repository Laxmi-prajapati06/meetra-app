// src/components/People.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './People.css';

const People = () => {
  const [connected, setConnected] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('meetra_token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Normalize IDs to strings to avoid ObjectId/string mismatches
        const normalized = data.data.map(u => ({ ...u, _id: u._id && u._id.toString ? u._id.toString() : String(u._id) }));
        setUsers(normalized);
        // For demo, mark first two as connected (string IDs)
        setConnected(normalized.slice(0, 2).map(u => u._id));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      const token = localStorage.getItem('meetra_token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setConnected(prev => [...prev, userId]);
      }
    } catch (error) {
      console.error('Error connecting user:', error);
    }
  };

  const handleMessage = (userId) => {
    const id = userId && userId.toString ? userId.toString() : String(userId);

    // Remove any existing chat state for this conversation first
    window.dispatchEvent(new CustomEvent('clear-conversation', { detail: { userId: id } }));

    // Dispatch a global navigation event to open Messages in the SPA
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'messages' } }));

    // Dispatch open-conversation after a short delay so Messages component is mounted
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-conversation', { detail: { userId: id } }));
    }, 120);
  };

  if (loading) {
    return (
      <div className="people-page">
        <div className="loading">Loading people...</div>
      </div>
    );
  }

  return (
    <div className="people-page">
      <h1>People</h1>
      
      <div className="connected-section">
        <h2>Your Connections</h2>
        <div className="people-list">
          {users
            .filter(userItem => connected.includes(userItem._id))
            .map(userItem => (
              <div key={userItem._id} className="person-card">
                <div className="person-avatar">
                  {userItem.username?.charAt(0).toUpperCase()}
                </div>
                <h3>{userItem.username}</h3>
                <p>{userItem.profile?.branch || 'No branch specified'}</p>
                <div className="interests">
                  {userItem.profile?.interests?.slice(0, 3).map((interest, index) => (
                    <span key={index} className="interest-tag">{interest}</span>
                  ))}
                </div>
                <div className="person-actions">
                  <button className="btn-connected">Connected</button>
                  <button 
                    className="btn-secondary"
                    onClick={() => handleMessage(userItem._id)}
                  >
                    Message
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="suggested-section">
        <h2>People You May Know</h2>
        <div className="people-list">
          {users
            .filter(userItem => !connected.includes(userItem._id) && userItem._id !== user?._id)
            .map(userItem => (
              <div key={userItem._id} className="person-card">
                <div className="person-avatar">
                  {userItem.username?.charAt(0).toUpperCase()}
                </div>
                <h3>{userItem.username}</h3>
                <p>{userItem.profile?.branch || 'No branch specified'}</p>
                <div className="interests">
                  {userItem.profile?.interests?.slice(0, 3).map((interest, index) => (
                    <span key={index} className="interest-tag">{interest}</span>
                  ))}
                </div>
                <div className="person-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => handleConnect(userItem._id)}
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default People;