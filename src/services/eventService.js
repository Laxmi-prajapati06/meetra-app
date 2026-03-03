
// Mock data for development
const mockEvents = [
  {
    id: 1,
    title: 'Data Science & AI Workshop',
    category: 'Academic / Educational',
    date: '2023-10-15',
    time: '2:00 PM - 5:00 PM',
    location: 'Tech Block Room 302',
    attendees: 15,
    maxAttendees: 30,
    organizer: 'CS Department',
    description: 'Hands-on workshop on Python, Machine Learning, and Data Analysis. Perfect for beginners and intermediate learners.',
    image: '/event-coding.jpg',
    price: 'Free',
    tags: ['Python', 'Machine Learning', 'Beginner Friendly']
  },
  {
    id: 2,
    title: 'Campus Music Night',
    category: 'Entertainment',
    date: '2023-10-20',
    time: '6:00 PM - 9:00 PM',
    location: 'University Amphitheater',
    attendees: 40,
    maxAttendees: 100,
    organizer: 'Music Club',
    description: 'An evening of live music performances by talented students. Bring your friends and enjoy the melodies!',
    image: '/event-music.jpg',
    price: 'Free',
    tags: ['Live Music', 'Social', 'Performance']
  },
  {
    id: 3,
    title: 'Inter-College Basketball Tournament',
    category: 'Sports & Fitness',
    date: '2023-10-25',
    time: '3:00 PM - 7:00 PM',
    location: 'University Basketball Court',
    attendees: 24,
    maxAttendees: 50,
    organizer: 'Sports Committee',
    description: 'Annual basketball tournament featuring teams from across the city. Come support your college team!',
    image: '/event-basketball.jpg',
    price: 'Free',
    tags: ['Tournament', 'Competitive', 'Team Sports']
  },
  {
    id: 4,
    title: 'Mindfulness & Meditation Session',
    category: 'Spiritual/Religious',
    date: '2023-10-18',
    time: '7:00 AM - 8:00 AM',
    location: 'Peace Garden',
    attendees: 20,
    maxAttendees: 40,
    organizer: 'Wellness Club',
    description: 'Start your day with guided meditation and mindfulness exercises. Perfect for stress relief and mental wellness.',
    image: '/event-meditation.jpg',
    price: 'Free',
    tags: ['Meditation', 'Wellness', 'Mindfulness']
  },
  {
    id: 5,
    title: 'Cultural Fest Preparation',
    category: 'Cultural',
    date: '2023-10-22',
    time: '4:00 PM - 7:00 PM',
    location: 'Auditorium',
    attendees: 35,
    maxAttendees: 60,
    organizer: 'Cultural Committee',
    description: 'Planning and practice session for the upcoming annual cultural festival. Dancers, singers, and performers welcome!',
    image: '/event-cultural.jpg',
    price: 'Free',
    tags: ['Dance', 'Music', 'Performance']
  },
  {
    id: 6,
    title: 'Startup Pitch Competition',
    category: 'Academic / Educational',
    date: '2023-10-28',
    time: '10:00 AM - 2:00 PM',
    location: 'Business School Auditorium',
    attendees: 28,
    maxAttendees: 50,
    organizer: 'Entrepreneurship Cell',
    description: 'Pitch your startup ideas to industry experts and win exciting prizes. Great opportunity for aspiring entrepreneurs.',
    image: '/event-startup.jpg',
    price: 'Free',
    tags: ['Entrepreneurship', 'Pitching', 'Competition']
  }
];

export const eventService = {
  // Get all events - tries real API first, falls back to mock data
  async getEvents() {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/events`);
      if (!response.ok) {
        throw new Error('API not available');
      }
      return response.json();
    } catch (error) {
      console.log('Using mock data for events:', error.message);
      // Return mock data if API is not available
      return mockEvents;
    }
  },

  // Get events by category
  async getEventsByCategory(category) {
    try {
      const url = category === 'All' 
        ? `${process.env.REACT_APP_API_URL}/events`
        : `${process.env.REACT_APP_API_URL}/events?category=${encodeURIComponent(category)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('API not available');
      }
      return response.json();
    } catch (error) {
      console.log('Using mock data for events by category:', error.message);
      // Filter mock data by category
      if (category === 'All') {
        return mockEvents;
      }
      return mockEvents.filter(event => event.category === category);
    }
  },

  // Join an event
  async joinEvent(eventId, userId) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/events/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('API not available');
      }
      return response.json();
    } catch (error) {
      console.log('Using mock join event:', error.message);
      // Mock successful join
      return { success: true, eventId, userId };
    }
  },

  // Leave an event
  async leaveEvent(eventId, userId) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/events/${eventId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('API not available');
      }
      return response.json();
    } catch (error) {
      console.log('Using mock leave event:', error.message);
      // Mock successful leave
      return { success: true, eventId, userId };
    }
  },

  // Create a new event
  async createEvent(eventData) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        throw new Error('API not available');
      }
      return response.json();
    } catch (error) {
      console.log('Using mock create event:', error.message);
      // Mock successful creation
      return { success: true, event: { ...eventData, id: Date.now() } };
    }
  }
};