// src/components/Home.js
import React from 'react';
import './Home.css';

const Home = ({ setCurrentPage }) => {
  const features = [
    {
      title: "Secure User Authentication",
      description: "Ensures that only verified Medicaps University students can create an account and access the platform."
    },
    {
      title: "Personalized Profiles",
      description: "Allows students to create a simple profile to showcase their interests and a brief bio."
    },
    {
      title: "Event and Activity Creation",
      description: "Provides a streamlined way for users to create and host their own events."
    },
    {
      title: "Real-time Event Discovery",
      description: "An 'Explore' feed with filtering options to discover events around campus or the city."
    },
    {
      title: "In-app Messaging",
      description: "A private, real-time chat feature for participants to communicate and coordinate."
    }
  ];

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Explore your city, Meet your people</h1>
          <p>Connect with fellow Medicaps University students and discover exciting events around Indore.</p>
          <div className="hero-buttons">
            <button 
              className="btn-primary"
              onClick={() => setCurrentPage('explore')}
            >
              Start Exploring
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setCurrentPage('events')}
            >
              Create a hangout/event
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Students socializing" />
        </div>
      </div>

      <div className="features-section">
        <h2>Why Use Meetra?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;