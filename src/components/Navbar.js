// src/components/Navbar.js
import React from 'react';
import './Navbar.css';

const Navbar = ({ currentPage, setCurrentPage, isLoggedIn, setIsLoggedIn }) => {
  
  const handleSignOut = () => {
    // Clear authentication state
    setIsLoggedIn(false);
    
    // Clear any stored tokens or user data from localStorage
    localStorage.removeItem('meetra_token');
    localStorage.removeItem('user_data');
    
    // Redirect to home page
    setCurrentPage('home');
    
    // Show success message
    alert('You have been signed out successfully!');
    
    console.log('User signed out');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src="/logo.jpg" alt="Meetra Logo" className="navbar-logo" />
        <span className="navbar-brand">Meetra</span>
      </div>
      <div className="navbar-right">
        <button 
          className={currentPage === 'home' ? 'navbar-tab active' : 'navbar-tab'}
          onClick={() => setCurrentPage('home')}
        >
          Home
        </button>
        <button 
          className={currentPage === 'events' ? 'navbar-tab active' : 'navbar-tab'}
          onClick={() => setCurrentPage('events')}
        >
          Events
        </button>
        <button 
          className={currentPage === 'explore' ? 'navbar-tab active' : 'navbar-tab'}
          onClick={() => setCurrentPage('explore')}
        >
          Explore
        </button>
        <button 
          className={currentPage === 'people' ? 'navbar-tab active' : 'navbar-tab'}
          onClick={() => setCurrentPage('people')}
        >
          People
        </button>
        <button 
          className={currentPage === 'messages' ? 'navbar-tab active' : 'navbar-tab'}
          onClick={() => setCurrentPage('messages')}
        >
          Messages
        </button>
        
        {isLoggedIn ? (
          <>
            <button 
              className={currentPage === 'profile' ? 'navbar-tab active' : 'navbar-tab'}
              onClick={() => setCurrentPage('profile')}
            >
              Profile
            </button>
            <button 
              className="navbar-tab signout-btn"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </>
        ) : (
          <button 
            className={currentPage === 'signin' ? 'navbar-tab active' : 'navbar-tab'}
            onClick={() => setCurrentPage('signin')}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;