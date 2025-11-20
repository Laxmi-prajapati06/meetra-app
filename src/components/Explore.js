// src/components/Explore.js
import React, { useState } from 'react';
import './Explore.css';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

const Explore = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const categories = [
    'Cafes',
    'Restaurants',
    'Parks',
    'Monuments',
    'Religious places',
    'Adventure',
    'Museums'
  ];

  const samplePlaces = [
    {
      id: 1,
      name: 'Chappan Dukan',
      category: 'Restaurants',
      description: 'Famous street food lane with 56 shops offering variety of delicacies.'
    },
    {
      id: 2,
      name: 'Rajwada Palace',
      category: 'Monuments',
      description: 'Historical palace built by the Holkars in the 18th century.'
    },
    {
      id: 3,
      name: 'Sarafa Bazaar',
      category: 'Restaurants',
      description: 'Famous night food market offering various Indori delicacies.'
    },
    {
      id: 4,
      name: 'Lal Bagh Palace',
      category: 'Monuments',
      description: 'A magnificent palace showcasing the luxury of Holkar reign.'
    },
    {
      id: 5,
      name: 'Patalpani Waterfall',
      category: 'Adventure',
      description: 'Beautiful waterfall and popular picnic spot.'
    },
    {
      id: 6,
      name: 'Regional Park',
      category: 'Parks',
      description: 'Beautiful park with walking trails and recreational activities.'
    }
  ];

  const filteredPlaces = selectedCategory 
    ? samplePlaces.filter(place => place.category === selectedCategory)
    : samplePlaces;

  const { isAuthenticated, user, updateUser } = useAuth();
  const [planned, setPlanned] = useState(() => {
    try {
      const existing = (user && user.plannedVisits) || [];
      return new Set(existing.map(p => p.placeId?.toString()));
    } catch (e) {
      return new Set();
    }
  });

  const handlePlanVisit = async (place) => {
    if (!isAuthenticated) {
      alert('Please sign in to plan a visit');
      return;
    }

    try {
      const payload = { placeId: place.id?.toString(), name: place.name, category: place.category };
      const res = await usersAPI.planVisit(payload);
      if (res && res.success) {
        // Update local planned set
        setPlanned(prev => new Set(prev).add(payload.placeId));

        // Update auth context so profile shows persisted planned visits
        if (updateUser) {
          // res.data is the updated plannedVisits array returned by the backend
          const plannedVisits = res.data || [];
          updateUser({ plannedVisits });
        }

        alert('Planned visit added to your profile');
      }
    } catch (err) {
      console.error('Plan visit failed', err);
      alert(err.message || 'Failed to plan visit');
    }
  };

  return (
    <div className="explore-page">
      <h1>Explore Indore</h1>
      <div className="explore-filter">
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category, index) => (
            <option key={index} value={category}>{category}</option>
          ))}
        </select>
      </div>
      <div className="places-list">
        {filteredPlaces.map(place => (
          <div key={place.id} className="place-card">
            <h3>{place.name}</h3>
            <p><strong>Category:</strong> {place.category}</p>
            <p>{place.description}</p>
            <button className="btn-primary" onClick={() => handlePlanVisit(place)} disabled={planned.has(place.id)}>
              {planned.has(place.id) ? 'Planned' : 'Plan Visit'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore;