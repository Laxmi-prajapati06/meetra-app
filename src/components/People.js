// src/components/People.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './People.css';
import { usersAPI } from '../services/api'; 

// --- ConnectedUserProfileModal remains unchanged (omitted for brevity) ---
const ConnectedUserProfileModal = ({ userId, onClose, connections }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      setError(null);
      // Fetch the full profile of the connected user
      usersAPI.getUser(userId)
        .then(res => {
          if (res.success && res.data) {
            setProfile(res.data);
          } else {
            setError(res.message || 'Failed to load profile.');
          }
        })
        .catch(err => {
          console.error('Fetch profile error:', err);
          setError(err.message || 'Server error while fetching profile.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userId]);

  if (!userId) return null;

  // Use the data from the API call or the local connections list if available
  const connectedUser = profile || connections.find(c => String(c.user?._id || c._id) === String(userId))?.user;
  
  if (!connectedUser) {
    return (
        <div className="modal-overlay-people">
            <div className="modal-content-people">
                <div className="modal-header-people">
                    <h2>Profile</h2>
                    <button className="close-btn-people" onClick={onClose}>×</button>
                </div>
                {loading ? (
                    <div className="loading-container modal-loading">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Loading profile details...</p>
                    </div>
                ) : (
                    <div className="error-message-people">Profile not found.</div>
                )}
            </div>
        </div>
    );
  }

  const name = connectedUser.profile?.fullName || connectedUser.username || 'User Profile';
  const branch = connectedUser.profile?.branch || 'N/A';
  const specialization = connectedUser.profile?.specialization || 'N/A';
  const about = connectedUser.profile?.about || 'No description provided.';
  const interests = connectedUser.profile?.interests || [];
  const plannedVisits = connectedUser.plannedVisits || [];
  const joinedEvents = connectedUser.eventsJoined || [];
  const avatar = connectedUser.profile?.profilePicture || null;

  return (
    <div className="modal-overlay-people">
      <div className="modal-content-people">
        <div className="modal-header-people">
          <h2>{name}'s Profile</h2>
          <button className="close-btn-people" onClick={onClose}>×</button>
        </div>
        
        {loading ? (
          <div className="loading-container modal-loading">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading profile details...</p>
          </div>
        ) : error ? (
          <div className="error-message-people">{error}</div>
        ) : (
          <div className="profile-details-people">
            <div className="profile-header-people">
              <div className="profile-avatar-people">
                {avatar ? (
                  <img src={avatar} alt={name} />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <h3>{name}</h3>
              <p className="branch-info-people">{branch} {specialization !== 'N/A' && `(${specialization})`}</p>
              <p className="about-text-people">{about}</p>
            </div>

            <div className="profile-section-people">
              <h4><span role="img" aria-label="light-bulb">💡</span> Interests</h4>
              <div className="interests-list-people">
                {interests.length > 0 ? interests.map((interest, index) => (
                  <span key={index} className="interest-tag-people">{interest}</span>
                )) : <p className="muted-text-people">No interests listed.</p>}
              </div>
            </div>

            <div className="profile-section-people">
              <h4><span role="img" aria-label="calendar">🗓️</span> Joined Events ({joinedEvents.length})</h4>
              <ul className="simple-list-people">
                {joinedEvents.length > 0 ? joinedEvents.map((event, index) => (
                  <li key={index} className="list-item-people">
                    {event.title} 
                    <span className="list-meta-people">({event.category})</span>
                  </li>
                )) : <p className="muted-text-people">No events joined.</p>}
              </ul>
            </div>
            
            <div className="profile-section-people">
              <h4><span role="img" aria-label="map-pin">📍</span> Planned Visits ({plannedVisits.length})</h4>
              <ul className="simple-list-people">
                {plannedVisits.length > 0 ? plannedVisits.map((visit, index) => (
                  <li key={index} className="list-item-people">
                    {visit.name} 
                    <span className="list-meta-people">({visit.category})</span>
                  </li>
                )) : <p className="muted-text-people">No visits planned.</p>}
              </ul>
            </div>
          </div>
        )}
        
        <div className="modal-actions-people">
            <button 
                className="btn-primary"
                onClick={() => {
                    onClose();
                    // Navigate to messages and open chat
                    const userToMessage = connectedUser._id || userId;
                    window.dispatchEvent(new CustomEvent('clear-conversation', { detail: { userId: userToMessage } }));
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'messages' } }));
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('open-conversation', { detail: { userId: userToMessage } }));
                    }, 120);
                }}
            >
                Message {name.split(' ')[0]}
            </button>
        </div>
      </div>
    </div>
  );
};
// --- End ConnectedUserProfileModal ---


const People = () => {
  const [suggestions, setSuggestions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null); 
  const { user, isAuthenticated, updateUser } = useAuth(); 

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch suggestions on mount
      fetchSuggestions();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]); // Dependency on user ensures suggestions refresh if connections change outside this component

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      
      const suggestionsData = await usersAPI.getSuggestions();

      if (suggestionsData.success) {
        const normalizedSuggestions = (suggestionsData.data || []).map(u => ({ 
            ...u, 
            _id: String(u._id)
        }));
        setSuggestions(normalizedSuggestions);
      } else {
         console.error('Failed to fetch suggestions:', suggestionsData.message);
         setSuggestions([]);
      }
      
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      // 1. Send connection request to the backend
      const res = await usersAPI.connectUser(userId); 

      if (res.success && res.data) {
        // 2. Update the auth context with the returned user data (which includes new connections)
        // This ensures connections persist across page refresh
        if (updateUser) {
          updateUser(res.data);
        }
        // 3. Refetch suggestions to remove connected user and update UI
        await fetchSuggestions();
      } else {
          // If the API call returned a non-success JSON response (e.g., 400 'Already connected')
          throw new Error(res.message || 'Connection request failed.');
      }

    } catch (error) {
      // This catches API connection errors or custom errors thrown above
      console.error('Error connecting user:', error);
      alert(error.message || 'Failed to connect with user. Please try again.'); 
      // Re-fetch suggestions to ensure UI is in sync with backend state (in case of a partial failure)
      fetchSuggestions();
    }
  };

  const handleMessage = (userId) => {
    const id = userId && userId.toString ? userId.toString() : String(userId);
    window.dispatchEvent(new CustomEvent('clear-conversation', { detail: { userId: id } }));
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'messages' } }));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-conversation', { detail: { userId: id } }));
    }, 120);
  };
  
  const connections = user?.connections?.filter(c => c.user)?.map(c => c.user) || [];

  if (loading) {
    return (
      <div className="people-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Finding your best matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="people-page">
      <h1>Find Your People</h1>
      
      <div className="connected-section">
        <h2><span role="img" aria-label="handshake">🤝</span> Your Connections ({connections.length})</h2>
        <div className="people-list">
          {connections.length > 0 ? (
            connections.map(userItem => (
              <div key={userItem._id} className="person-card connected-card">
                <div>
                  <div className="person-avatar">
                    {userItem.profile?.profilePicture ? (
                      <img src={userItem.profile.profilePicture} alt={userItem.username} />
                    ) : (
                      userItem.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h3>{userItem.profile?.fullName || userItem.username}</h3>
                  <p className="branch-info">{userItem.profile?.branch || 'No branch specified'}</p>
                  
                  <div className="interests">
                    {userItem.profile?.interests?.slice(0, 3).map((interest, index) => (
                      <span key={index} className="interest-tag">{interest}</span>
                    ))}
                  </div>
                </div>
                
                <div className="person-actions">
                  <button 
                    className="btn-secondary view-profile-btn"
                    onClick={() => setSelectedUserId(userItem._id)} 
                  >
                    View Profile
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleMessage(userItem._id)}
                  >
                    Message
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-connections-message">
              <p>You haven't made any connections yet. Start exploring your matches below!</p>
            </div>
          )}
        </div>
      </div>

      <div className="suggested-section">
        <h2><span role="img" aria-label="target">🎯</span> Top Matches for You ({suggestions.length})</h2>
        <div className="people-list">
          {suggestions.length > 0 ? (
            suggestions.map(userItem => (
              <div key={userItem._id} className="person-card suggested-card">
                <div>
                  <div className="person-avatar">
                    {userItem.profile?.profilePicture ? (
                      <img src={userItem.profile.profilePicture} alt={userItem.username} />
                    ) : (
                      userItem.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h3>{userItem.profile?.fullName || userItem.username}</h3>
                  <p className="branch-info">{userItem.profile?.branch || 'No branch specified'}</p>
                
                  <div className="match-indicator">
                      {userItem.commonInterests > 0 && (
                          <p className="common-interests-text">
                            <span role="img" aria-label="star">⭐</span> 
                            {userItem.commonInterests} Common Interest{userItem.commonInterests !== 1 ? 's' : ''}
                          </p>
                      )}
                      {userItem.sameBranch === 1 && (
                          <p className="same-branch-text">
                            <span role="img" aria-label="department">🏢</span> 
                            Same Branch
                          </p>
                      )}
                      {userItem.commonInterests === 0 && userItem.sameBranch === 0 && (
                          <p className="match-default-text">Potential connection</p>
                      )}
                  </div>
                
                  <div className="interests">
                    {userItem.profile?.interests?.slice(0, 3).map((interest, index) => (
                      <span key={index} className="interest-tag">{interest}</span>
                    ))}
                  </div>
                </div>
                
                <div className="person-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => handleConnect(userItem._id)}
                    disabled={userItem._id === user?._id}
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))
          ) : (
             <div className="no-suggestions-message">
               <p>No new matches found at the moment. Update your <span onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'profile' } }))} >Profile</span> to get better suggestions!</p>
             </div>
          )}
        </div>
      </div>

      <ConnectedUserProfileModal 
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        connections={user?.connections || []}
      />
    </div>
  );
};

export default People;