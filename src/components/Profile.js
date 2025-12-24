// src/components/Profile.js
import React, { useState, useEffect, useMemo } from 'react';
import './Profile.css';
import { useAuth } from '../context/AuthContext';
import { eventsAPI, usersAPI, uploadAPI } from '../services/api';

const Profile = () => {
  const { user, loading, updateProfile, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [joinedEventTitles, setJoinedEventTitles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const joinedEvents = useMemo(() => (user?.eventsJoined || []), [user?.eventsJoined]);
  useEffect(() => {
    let mounted = true;

    const fetchTitles = async () => {
      const isObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      const idsToFetch = (joinedEvents || []).filter(ev => typeof ev === 'string' && isObjectId(ev) && !(joinedEventTitles[ev]));
      if (idsToFetch.length === 0) return;

      for (const id of idsToFetch) {
        try {
          const res = await eventsAPI.getEvent(id);
          if (res && res.data && mounted) {
            setJoinedEventTitles(prev => ({ ...prev, [id]: res.data.title || res.data.name || String(id) }));
          }
        } catch (err) {
          if (mounted) {
            setJoinedEventTitles(prev => ({ ...prev, [id]: String(id) }));
          }
        }
      }
    };

    fetchTitles();

    return () => { mounted = false; };
  }, [joinedEvents, joinedEventTitles]);

  if (loading) {
    return <div className="profile-page"><h2>Loading profile…</h2></div>;
  }

  if (!user) {
    return (
      <div className="profile-page">
        <h2>No user signed in</h2>
      </div>
    );
  }

  const name = user.profile?.fullName || user.username || 'Unknown User';
  const email = user.email || '';
  const branch = user.profile?.branch || '';
  const specialization = user.profile?.specialization || '';
  const about = user.profile?.about || '';
  const interests = user.profile?.interests || [];
  const avatar = user.profile?.profilePicture || null;
  const plannedVisits = user.plannedVisits || [];


  const startEdit = () => {
    setForm({
      fullName: user.profile?.fullName || '',
      branch: user.profile?.branch || '',
      specialization: user.profile?.specialization || '',
      about: user.profile?.about || '',
      interests: (user.profile?.interests || []).join(', ')
    });
    setError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    // Check if file size is reasonable for faster upload (< 2MB recommended)
    if (file.size > 2 * 1024 * 1024) {
      console.warn('[Profile] Large file detected, upload may take longer');
    }

    setUploading(true);
    setUploadError(null);
    try {
      console.log(`[Profile] Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
      const result = await uploadAPI.uploadProfilePicture(file);
      console.log('[Profile] Upload result:', result);
      
      if (result.success && (result.data || result.user)) {
        // Update user context with new profile picture
        updateUser(result.data || result.user);
        setUploadError(null);
      } else {
        setUploadError(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error('[Profile] Upload error:', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (e.target) e.target.value = '';
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        fullName: form.fullName,
        branch: form.branch,
        specialization: form.specialization,
        about: form.about,
        interests: form.interests.split(',').map(s => s.trim()).filter(Boolean)
      };
      console.log('saveProfile payload:', payload);
      const result = await updateProfile(payload);
      console.log('updateProfile result:', result);

      if (!result || !result.success) {
        // Show detailed error information if available
        const parts = [];
        if (result?.status) parts.push(`status: ${result.status}`);
        if (result?.error) parts.push(result.error);
        if (result?.raw) parts.push(`raw: ${JSON.stringify(result.raw)}`);
        const message = parts.length ? parts.join(' | ') : (result?.error || 'Failed to update profile');
        setError(message);
        setSaving(false);
        return;
      }

      // updateProfile already updated context; reflect change in UI
      setIsEditing(false);
    } catch (err) {
      console.error('Profile save error:', err);
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <h1>Your Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {avatar ? (
              <img src={avatar} alt={name} />
            ) : (
              name.charAt(0)
            )}
          </div>
          <h2>{name}</h2>
        </div>

        {!isEditing ? (
          <>
            <div className="profile-details">
              <div className="detail-item">
                <strong>Email:</strong> {email}
              </div>
              <div className="detail-item">
                <strong>Branch:</strong> {branch}
              </div>
              <div className="detail-item">
                <strong>Specialization:</strong> {specialization}
              </div>
              <div className="detail-item">
                <strong>About:</strong> {about}
              </div>
              <div className="detail-item">
                <strong>Interests:</strong>
                <div className="interests-list">
                  {interests.map((interest, index) => (
                    <span key={index} className="interest-tag">{interest}</span>
                  ))}
                </div>
              </div>
              <div className="detail-item">
                <strong>Planned Visits:</strong>
                <div className="planned-list">
                  {plannedVisits.length > 0 ? (
                    <ul className="simple-list">
                      {Array.from(new Map(plannedVisits.map(p => [p.placeId?.toString() || JSON.stringify(p), p])).values()).map((p, idx) => (
                        <li key={idx} className="planned-row">
                          <span>{p?.name || String(p)}</span>
                          <button
                            className="btn-link remove-btn"
                            onClick={async () => {
                              try {
                                // Call backend to remove planned visit
                                const placeId = p.placeId?.toString();
                                if (!placeId) {
                                  // If no placeId, remove locally
                                  const updated = (plannedVisits || []).filter(item => item !== p);
                                  if (updateUser) updateUser({ plannedVisits: updated });
                                  return;
                                }
                                const res = await usersAPI.unplanVisit(placeId);
                                if (res && res.success) {
                                  // update auth context (local copy)
                                  if (updateUser) updateUser({ plannedVisits: res.data });
                                }
                              } catch (err) {
                                console.error('Failed to remove planned visit', err);
                                alert(err.message || 'Failed to remove planned visit');
                              }
                            }}
                          >Remove</button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="muted">No planned visits</div>
                  )}
                </div>
              </div>
              <div className="detail-item">
                <strong>Joined Events:</strong>
                <div className="joined-list">
                  {joinedEvents.length > 0 ? (
                    <ul className="simple-list">
                      {Array.from(new Map((joinedEvents || []).map(ev => {
                        const key = typeof ev === 'string' ? ev : (ev._id ? ev._id.toString() : (ev.title || JSON.stringify(ev)));
                        return [key, ev];
                      })).values()).map((ev, idx) => (
                        <li key={idx} className="joined-row">
                          <span>{typeof ev === 'string' ? (joinedEventTitles[ev] || ev) : ((ev && (ev.title || ev.name)) || String(ev))}</span>
                          <button
                            className="btn-link remove-btn"
                            onClick={async () => {
                              try {
                                // If ev is string and looks like ObjectId, call backend leave endpoint
                                const isObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
                                if (typeof ev === 'string' && isObjectId(ev)) {
                                  const res = await eventsAPI.leaveEvent(ev);
                                  if (res && res.success) {
                                    // refresh user in context by removing the id
                                    if (typeof updateProfile === 'function') {
                                      // attempt to fetch fresh user via auth.getMe would be better, but remove locally
                                    }
                                    // simple approach: update by filtering existing
                                    const existing = user?.eventsJoined || [];
                                    const updated = existing.filter(item => {
                                      if (!item) return false;
                                      if (typeof item === 'string') return item !== ev;
                                      if (item._id) return item._id.toString() !== ev;
                                      return true;
                                    });
                                    if (updateUser) updateUser({ eventsJoined: updated });
                                  }
                                } else {
                                  // ev is likely an object (local/simulated event) — remove locally
                                  const existing = user?.eventsJoined || [];
                                  const updated = existing.filter(item => {
                                    if (!item) return false;
                                    if (typeof item === 'string') return true; // keep string ids
                                    if (item._id) return item._id.toString() !== (ev._id || '');
                                    return item !== ev;
                                  });
                                  if (updateUser) updateUser({ eventsJoined: updated });
                                }
                              } catch (err) {
                                console.error('Failed to remove joined event', err);
                                alert(err.message || 'Failed to remove joined event');
                              }
                            }}
                          >Remove</button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="muted">No joined events</div>
                  )}
                </div>
              </div>
            </div>
            <button className="btn-primary" onClick={startEdit}>Edit Profile</button>
          </>
        ) : (
          <div className="profile-edit">
            <div className="profile-picture-upload">
              <label>Profile Picture</label>
              <div className="avatar-container">
                <div className="profile-avatar-edit">
                  {user.profile?.profilePicture ? (
                    <img src={user.profile.profilePicture} alt="Profile" />
                  ) : (
                    name.charAt(0)
                  )}
                </div>
                <div className="upload-controls">
                  <input
                    type="file"
                    id="profilePictureInput"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => document.getElementById('profilePictureInput').click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading…' : 'Change Picture'}
                  </button>
                  {uploadError && <div className="error small">{uploadError}</div>}
                </div>
              </div>
            </div>
            <div className="form-row">
              <label>Full name</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} />
            </div>
            <div className="form-row">
              <label>Branch</label>
              <select name="branch" value={form.branch} onChange={handleChange}>
                <option value="">Select branch</option>
                <option>Computer Science</option>
                <option>Information Technology</option>
                <option>Electronics</option>
                <option>Mechanical</option>
                <option>Civil</option>
                <option>Business</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-row">
              <label>Specialization</label>
              <input name="specialization" value={form.specialization} onChange={handleChange} />
            </div>
            <div className="form-row">
              <label>About</label>
              <textarea name="about" value={form.about} onChange={handleChange} />
            </div>
            <div className="form-row">
              <label>Interests (comma separated)</label>
              <input name="interests" value={form.interests} onChange={handleChange} />
            </div>
            {error && <div className="error">{error}</div>}
            <div className="edit-actions">
              <button className="btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button className="btn-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;