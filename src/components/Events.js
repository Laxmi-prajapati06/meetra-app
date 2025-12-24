import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import './Events.css';

// Sample events data (module-level so effects don't need it as a dependency)
const sampleEvents = [
  {
    _id: '1',
    title: 'Data Science Workshop',
    description: 'Learn data science with hands-on projects and real-world examples. Perfect for beginners and intermediate learners.',
    category: 'Academic / Educational',
    date: '2024-01-15',
    time: { start: '2:00 PM', end: '5:00 PM' },
    location: 'Tech Block Room 302',
    maxAttendees: 30,
    attendees: ['user1', 'user2'],
    organizer: { username: 'tech_club', _id: 'org1' },
    price: { type: 'free', amount: 0 },
    tags: ['coding', 'data science', 'workshop'],
    image: 'https://miro.medium.com/1*RI6Gbi2PW5_ltDjCfp1-5w.jpeg'
  },
  {
    _id: '2',
    title: 'Campus Music Night',
    description: 'An evening of live music performances by talented students. Bring your friends and enjoy the melodies!',
    category: 'Entertainment',
    date: '2024-01-20',
    time: { start: '6:00 PM', end: '9:00 PM' },
    location: 'University Amphitheater',
    maxAttendees: 100,
    attendees: ['user3', 'user4', 'user5'],
    organizer: { username: 'music_club', _id: 'org2' },
    price: { type: 'free', amount: 0 },
    tags: ['music', 'live', 'entertainment'],
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsg-qhCE6vcpmI2zZvWAPufBHHnsAm83lqWw&s'
  },
  {
  _id: '3',
  title: 'Indore Heritage Walk',
  description: 'Explore the rich cultural heritage of Indore with a guided walk through Rajwada Palace, Lal Bagh Palace, and other historical landmarks. Learn about the Holkar dynasty and Maratha architecture.',
  category: 'Cultural',
  date: '2026-02-10',
  time: { start: '7:00 AM', end: '10:00 AM' },
  location: 'Rajwada Palace, Indore',
  maxAttendees: 40,
  attendees: ['user6', 'user7', 'user8'],
  organizer: { username: 'heritage_club', _id: 'org3' },
  price: { type: 'free', amount: 0 },
  tags: ['heritage', 'history', 'walking', 'indore'],
  image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfal6qUlguYUU6sKVxkDCY6qmPvsJyZoufig&s'
},
{
  _id: '4',
  title: 'Sarod Recital by Ustad Amjad Ali Khan',
  description: 'An enchanting evening of classical Indian music featuring the legendary Ustad Amjad Ali Khan and his sons. Experience the magic of sarod in this special performance.',
  category: 'Cultural',
  date: '2026-02-18',
  time: { start: '6:30 PM', end: '9:00 PM' },
  location: 'Ravindra Natya Griha, Indore',
  maxAttendees: 200,
  attendees: ['user9', 'user10'],
  organizer: { username: 'music_society', _id: 'org4' },
  price: { type: 'paid', amount: 300 },
  tags: ['classical music', 'sarod', 'indian music', 'cultural'],
  image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5YoxdapuMQQ52KLVG9XRZHxgWdS9xRp2ttg&s'
},
{
  _id: '5',
  title: 'Sarafa Bazaar Food Walk',
  description: 'Join fellow food enthusiasts for a night walk through Sarafa Bazaar, Indore\'s famous night food street. Taste local delicacies like poha-jalebi, bhutte ka kees, and more!',
  category: 'Social Gathering',
  date: '2026-01-25',
  time: { start: '9:00 PM', end: '11:30 PM' },
  location: 'Sarafa Bazaar, Indore',
  maxAttendees: 25,
  attendees: ['user11', 'user12', 'user13', 'user14'],
  organizer: { username: 'foodie_club', _id: 'org5' },
  price: { type: 'paid', amount: 500 },
  tags: ['food', 'street food', 'social', 'indore food'],
  image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZshigOepx1u2zwZjWaZSME4aqMkm3upOEtw&s'
},
{
  _id: '6',
  title: 'Chappan Dukan Food Festival',
  description: 'Celebrate Indore\'s famous 56 shops with a food festival featuring all the iconic eateries. From garadu to kachori, experience the best of Indore street food in one place.',
  category: 'Social Gathering',
  date: '2026-02-05',
  time: { start: '5:00 PM', end: '10:00 PM' },
  location: 'Chappan Dukan, New Palasia, Indore',
  maxAttendees: 100,
  attendees: ['user15', 'user16'],
  organizer: { username: 'indore_foodies', _id: 'org6' },
  price: { type: 'free', amount: 0 },
  tags: ['food festival', 'chappan dukan', 'social', 'indore'],
  image: 'https://www.captureatrip.com/_next/image?url=https%3A%2F%2Fd1zvcmhypeawxj.cloudfront.net%2Flocation%2FMadhya%20pradesh%2Fblogs%2Fchappan-dukan-27380c94a2-lc3zif-webp-7fe7306724-1752060309186.webp&w=3840&q=50'
}

];

const Events = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [joinedEvents, setJoinedEvents] = useState(new Set());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const { isAuthenticated, user, updateUser } = useAuth();

  const categories = [
    'Academic / Educational',
    'Cultural',
    'Entertainment',
    'Sports & Fitness',
    'Spiritual/Religious',
    'Workshop',
    'Social Gathering'
  ];

  // Helper: normalize event to ensure it has an `image` property
  const normalizeEvent = (event) => {
    if (!event) return event;
    return {
      ...event,
      image: event.image || (event.images && event.images.length > 0 ? event.images[0].url : null)
    };
  };

  // Add Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'Academic / Educational',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    maxAttendees: 20,
    tags: '',
    priceType: 'free',
    priceAmount: '0',
    image: ''
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Try to fetch from backend
        const res = await eventsAPI.getEvents();
        if (res && res.success && Array.isArray(res.data)) {
          // Normalize events to have an `image` property
          const normalized = res.data.map(normalizeEvent);
          setEvents(normalized);
        } else {
          // Fallback to sample data
          setEvents(sampleEvents);
        }
      } catch (err) {
        console.error('Failed to fetch events from API, falling back to sample data', err);
        setEvents(sampleEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        (event.tags && event.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
        event.location.toLowerCase().includes(searchLower)
      );
    }

    setFilteredEvents(filtered);
  }, [events, selectedCategory, searchTerm]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    // Filtering is handled by the effect when `searchTerm` changes
  };

  const handleJoinEvent = async (eventId) => {
    if (!isAuthenticated) {
      alert('Please sign in to join events');
      return;
    }

    try {
      setLoading(true);

      // Helper to check for a Mongo ObjectId (24 hex chars)
      const isObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

      // If ID is not an ObjectId we treat the event as local/sample and simulate join/leave
      if (!isObjectId(eventId)) {
        if (joinedEvents.has(eventId)) {
          setJoinedEvents(prev => {
            const newSet = new Set(prev);
            newSet.delete(eventId);
            return newSet;
          });

          setEvents(prevEvents => 
            prevEvents.map(event => 
              event._id === eventId 
                ? { ...event, attendees: (event.attendees || []).slice(0, -1) }
                : event
            )
          );

          alert('You have left the event');
        } else {
          const event = events.find(e => e._id === eventId);
          if (!event) throw new Error('Event not found');
          if ((event.attendees || []).length >= (event.maxAttendees || 0)) {
            alert('This event is already full!');
            return;
          }

          setJoinedEvents(prev => new Set(prev).add(eventId));
          setEvents(prevEvents => 
            prevEvents.map(event => 
              event._id === eventId 
                ? { ...event, attendees: [...(event.attendees || []), user?.username || 'you'] }
                : event
            )
          );

          // Best-effort update of auth context (local-only)
          if (user) {
            const existing = user.eventsJoined || [];
            const evObj = events.find(e => e._id === eventId) || eventId;
            updateUser({ eventsJoined: [...existing, evObj] });
          }

          alert('Successfully joined the event!');
        }
      } else {
        // Real backend event id: call the API
        if (joinedEvents.has(eventId)) {
          await eventsAPI.leaveEvent(eventId);

          setJoinedEvents(prev => {
            const newSet = new Set(prev);
            newSet.delete(eventId);
            return newSet;
          });

          setEvents(prevEvents => 
            prevEvents.map(event => 
              event._id === eventId 
                ? { ...event, attendees: (event.attendees || []).slice(0, -1) }
                : event
            )
          );

          if (user && user.eventsJoined) {
            updateUser({ eventsJoined: user.eventsJoined.filter(e => {
              if (!e) return false;
              if (typeof e === 'string') return e !== eventId;
              if (e._id) return e._id.toString() !== eventId.toString();
              return true;
            }) });
          }

          alert('You have left the event');
        } else {
          const res = await eventsAPI.joinEvent(eventId);
          if (res && res.success) {
            setJoinedEvents(prev => new Set(prev).add(eventId));

            setEvents(prevEvents => 
              prevEvents.map(event => 
                event._id === eventId 
                  ? { ...event, attendees: [...(event.attendees || []), user?.username || 'you'] }
                  : event
              )
            );

            if (user) {
              const existing = user.eventsJoined || [];
              // res.data is the populated event object returned by the API
              const evObj = res.data || res.data?._id || eventId;
              updateUser({ eventsJoined: [...existing, evObj] });
            }

            alert('Successfully joined the event!');
          }
        }
      }
    } catch (err) {
      console.error('Join/leave error', err);
      alert(err.message || 'Failed to update event attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleAddEvent = () => {
    if (!isAuthenticated) {
      alert('Please sign in to create events');
      return;
    }
    setShowAddEventModal(true);
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!eventForm.title || !eventForm.description || !eventForm.date || 
        !eventForm.startTime || !eventForm.endTime || !eventForm.location) {
      alert('Please fill in all required fields');
      return;
    }

    if (eventForm.maxAttendees < 1) {
      alert('Maximum attendees must be at least 1');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: eventForm.title,
        description: eventForm.description,
        category: eventForm.category,
        date: eventForm.date,
        time: { start: eventForm.startTime, end: eventForm.endTime },
        location: eventForm.location,
        maxAttendees: parseInt(eventForm.maxAttendees, 10),
        tags: eventForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        price: {
          type: eventForm.priceType,
          amount: eventForm.priceType === 'free' ? 0 : parseFloat(eventForm.priceAmount || '0')
        },
        // Include image URL if provided
        images: eventForm.image ? [{ url: eventForm.image, publicId: null }] : []
      };

      console.log('[Event Creation] Payload:', payload);

      // If user is authenticated, persist to backend. Otherwise, fallback to local simulation.
      if (isAuthenticated) {
        const res = await eventsAPI.createEvent(payload);
        console.log('[Event Creation] Response:', res);
        if (res && res.success) {
          const created = normalizeEvent(res.data);
          setEvents(prev => [created, ...prev]);

          // Update auth context: add to user's created events if available
          if (user) {
            const existing = user.eventsCreated || [];
            updateUser({ eventsCreated: [created, ...existing] });
          }

          alert('Event created successfully!');
        } else {
          throw new Error(res?.message || 'Failed to create event');
        }
      } else {
        // Local simulation when not authenticated
        const newEvent = {
          _id: Date.now().toString(), // Temporary ID
          title: eventForm.title,
          description: eventForm.description,
          category: eventForm.category,
          date: eventForm.date,
          time: { start: eventForm.startTime, end: eventForm.endTime },
          location: eventForm.location,
          maxAttendees: parseInt(eventForm.maxAttendees, 10),
          attendees: [],
          organizer: { username: user?.username || 'Current User', _id: user?._id || 'current_user' },
          price: { type: eventForm.priceType, amount: eventForm.priceType === 'free' ? 0 : parseFloat(eventForm.priceAmount || '0') },
          tags: eventForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          image: eventForm.image || '/default-event.jpg'
        };

        setEvents(prev => [newEvent, ...prev]);
        alert('Event created (local)');
      }

      // Reset form and close modal
      setEventForm({
        title: '',
        description: '',
        category: 'Academic / Educational',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        maxAttendees: 20,
        tags: '',
        priceType: 'free',
        priceAmount: '0',
        image: ''
      });

      setShowAddEventModal(false);
    } catch (err) {
      console.error('Failed to create event', err);
      alert('Failed to create event: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getProgressPercentage = (event) => {
    const attendeesCount = event.attendees?.length || 0;
    return Math.min((attendeesCount / event.maxAttendees) * 100, 100);
  };

  const isEventFull = (event) => {
    return event.attendees?.length >= event.maxAttendees;
  };

  if (loading && events.length === 0) {
    return (
      <div className="events-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Upcoming Events</h1>
        <p>Discover and join exciting events happening around campus and Indore</p>
        <button 
          className="btn-primary add-event-btn"
          onClick={handleAddEvent}
        >
          + Add New Event
        </button>
      </div>

      <div className="events-controls">
        <div className="category-filters">
          <button
            className={`category-filter ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`category-filter ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSearch} className="search-bar">
          <div className="search-input-container">
            <input 
              type="text" 
              placeholder="Search events by title, description, tags, or location..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button"
                className="clear-search-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>
      </div>

      {filteredEvents.length > 0 && (
        <div className="events-stats">
          <p>Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      <div className="events-grid">
        {filteredEvents.map(event => {
          const isJoined = joinedEvents.has(event._id);
          const isFull = isEventFull(event);
          const progressPercentage = getProgressPercentage(event);
          
          return (
            <div key={event._id} className="event-card">
              <div className="event-image">
                <div
                  className="event-bg"
                  role="img"
                  aria-label={event.title}
                  style={{ backgroundImage: `url(${event.image || '/default-event.jpg'})` }}
                />
                <div className="event-price">{event.price?.type === 'free' ? 'Free' : `₹${event.price?.amount}`}</div>
                {isFull && <div className="event-full-badge">Full</div>}
              </div>
              
              <div className="event-content">
                <div className="event-date">
                  <span className="date-main">{formatDate(event.date)}</span>
                  <span className="date-time">{event.time.start} - {event.time.end}</span>
                </div>
                
                <h3 className="event-title">{event.title}</h3>
                
                <div className="event-meta">
                  <div className="meta-item">
                    <span className="material-icons">location_on</span>
                    {event.location}
                  </div>
                  <div className="meta-item">
                    <span className="material-icons">person</span>
                    {event.organizer?.username || 'Organizer'}
                  </div>
                </div>
                
                <p className="event-description">{event.description}</p>
                
                <div className="event-tags">
                  {event.tags?.map((tag, index) => (
                    <span key={index} className="event-tag">#{tag}</span>
                  ))}
                </div>
                
                <div className="event-attendance">
                  <div className="attendance-info">
                    <span className="attendees-count">
                      {event.attendees?.length || 0} going
                    </span>
                    <span className="max-attendees">• {event.maxAttendees} max</span>
                  </div>
                  <div className="attendance-progress">
                    <div 
                      className="progress-bar"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <button 
                  className={`join-btn ${isJoined ? 'joined' : ''} ${isFull ? 'full' : ''}`}
                  onClick={() => handleJoinEvent(event._id)}
                  disabled={isFull && !isJoined}
                >
                  {isJoined ? (
                    <>
                      <span className="btn-icon">✓</span>
                      You're Going
                    </>
                  ) : isFull ? (
                    <>
                      <span className="btn-icon">✗</span>
                      Event Full
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">+</span>
                      Join Event
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && !loading && (
        <div className="no-events">
          <div className="no-events-icon">📅</div>
          <h3>No events found</h3>
          <p>
            {searchTerm || selectedCategory !== 'All' 
              ? 'Try adjusting your search or filters'
              : 'Be the first to create an event!'
            }
          </p>
          {(searchTerm || selectedCategory !== 'All') ? (
            <button 
              className="btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
            >
              Clear Filters
            </button>
          ) : (
            <button 
              className="btn-primary"
              onClick={handleAddEvent}
            >
              Create First Event
            </button>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Event</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddEventModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitEvent} className="event-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Event Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={eventForm.title}
                    onChange={handleEventFormChange}
                    required
                    placeholder="Enter event title"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={eventForm.category}
                    onChange={handleEventFormChange}
                    required
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={eventForm.description}
                  onChange={handleEventFormChange}
                  required
                  rows="4"
                  placeholder="Describe your event in detail..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={eventForm.date}
                    onChange={handleEventFormChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="startTime">Start Time *</label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={eventForm.startTime}
                    onChange={handleEventFormChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="endTime">End Time *</label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={eventForm.endTime}
                    onChange={handleEventFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={eventForm.location}
                    onChange={handleEventFormChange}
                    required
                    placeholder="Where will the event take place?"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="maxAttendees">Max Attendees *</label>
                  <input
                    type="number"
                    id="maxAttendees"
                    name="maxAttendees"
                    value={eventForm.maxAttendees}
                    onChange={handleEventFormChange}
                    required
                    min="1"
                    max="500"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="priceType">Price Type</label>
                  <select
                    id="priceType"
                    name="priceType"
                    value={eventForm.priceType}
                    onChange={handleEventFormChange}
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                
                {eventForm.priceType === 'paid' && (
                  <div className="form-group">
                    <label htmlFor="priceAmount">Price (₹)</label>
                    <input
                      type="number"
                      id="priceAmount"
                      name="priceAmount"
                      value={eventForm.priceAmount}
                      onChange={handleEventFormChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={eventForm.tags}
                  onChange={handleEventFormChange}
                  placeholder="coding, workshop, social (comma separated)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="image">Event Image URL (Optional)</label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={eventForm.image}
                  onChange={handleEventFormChange}
                  placeholder="https://example.com/event-image.jpg"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowAddEventModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;